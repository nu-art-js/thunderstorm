import {
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateMustExist,
	tsValidateOptional,
	tsValidateOptionalAnyNumber,
	tsValidateOptionalObject,
	tsValidateRegexp,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {FirebaseHosting_EnvConfig, Unit_HostingApp} from '../../implementations/firebase/Unit_HostingApp.js';
import {Unit_ViteHostingApp} from '../../implementations/firebase/Unit_ViteHostingApp.js';
import {resolve} from 'path';
import {BaiParam_SetEnv} from '../../../core/params.js';

const valuesValidator = {
	config: tsValidateMustExist,
	projectId: tsValidateAnyString,
	isLocal: tsValidateBoolean(false),
};

const packageNameRegex = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

const hostingDeploymentValidator = {
	artifactRegistry: {
		region: tsValidateAnyString,
		repository: tsValidateAnyString,
		projectId: tsValidateAnyString,
	},
	packageName: tsValidateRegexp(packageNameRegex, true),
};

type UnitConfigJSON_ViteHosting_Node = import('../../discovery/resolvers/UnitMapper_Node.js').UnitConfigJSON_Node & {
	servingPort?: number,
	hostingConfig?: import('../../implementations/firebase/Unit_HostingApp.js').FirebaseHostingConfig
	envs: TypedMap<FirebaseHosting_EnvConfig>
};

export class UnitMapper_ViteHosting_Class
	extends UnitMapper_Node<Unit_ViteHostingApp, UnitConfigJSON_ViteHosting_Node> {

	static tsValidator_ViteHosting = {
		type: tsValidateValue(['vite-hosting']),
		servingPort: tsValidateOptionalAnyNumber,
		envs: tsValidateDynamicObject<TypedMap<FirebaseHosting_EnvConfig>>(valuesValidator, tsValidateAnyString),
		hostingConfig: tsValidateOptional,
		hostingDeployment: tsValidateOptionalObject(hostingDeploymentValidator),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_ViteHosting_Class.tsValidator_ViteHosting);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext<UnitConfigJSON_ViteHosting_Node>) {
		const outputDir = context.packageJson.publishConfig?.directory;
		const env = this.runtimeParams[BaiParam_SetEnv.keyName];
		const envUnitConfig = context.packageJson.unitConfig.envs[env];
		if (!envUnitConfig)
			this.logWarning('Package Json config:', context.packageJson.unitConfig);

		const envConfig = {
			config: envUnitConfig?.config,
			projectId: envUnitConfig?.projectId,
			isLocal: envUnitConfig?.isLocal ?? env === 'local'
		};

		const {type, ...unitConfig} = context.packageJson.unitConfig;
		return new Unit_ViteHostingApp({
			...context.baseConfig,
			...Unit_HostingApp.DefaultConfig_Hosting,
			...unitConfig,
			envConfig,
			isTopLevelApp: true,
			hasSelfHotReload: unitConfig.hasSelfHotReload ?? false,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: resolve(context.baseConfig.fullPath, outputDir ?? Unit_HostingApp.DefaultConfig_Hosting.output),
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_ViteHosting = new UnitMapper_ViteHosting_Class();
