import {
	ImplementationMissingException,
	tsValidate_OptionalArray,
	tsValidateAnyNumber,
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateDynamicObject,
	tsValidateOptionalAnyNumber,
	tsValidateOptionalAnyString,
	tsValidateOptionalObject,
	tsValidateRegexp,
	tsValidateResult,
	tsValidateValue,
	TypedMap
} from '@nu-art/ts-common';
import {UnitConfigJSON_Node, UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {FunctionConfig, Unit_FirebaseFunctionsApp} from '../../implementations/firebase/Unit_FirebaseFunctionsApp.js';
import {resolve} from 'path';
import {BaiParam_SetEnv} from '../../../core/params.js';


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
	functions: string[] | FunctionConfig[];  // Required: Array of function names (legacy) or function configs
};

const valuesValidator = {
	defaultConfig: tsValidateOptionalAnyString,
	envConfig: tsValidateOptionalAnyString,
	projectId: tsValidateAnyString,
	isLocal: tsValidateBoolean(false),
};

// Docker image name validation: lowercase, alphanumeric with dots, underscores, hyphens
// Cannot start/end with separators, no consecutive separators
// Pattern: starts with alphanumeric, optionally followed by (separator + alphanumeric) groups
const imageNameRegex = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

const containerDeploymentValidator = {
	artifactRegistry: {
		region: tsValidateAnyString,
		repository: tsValidateAnyString,
		projectId: tsValidateAnyString,
	},
	imageName: tsValidateRegexp(imageNameRegex, true), // Required: Docker image name matching Artifact Registry rules
	dockerfile: tsValidateOptionalAnyString,
};

// Validator for FunctionResourceConfig
const functionResourceConfigValidator = {
	cpu: tsValidateAnyNumber,
	memory: tsValidateOptionalAnyString,
	timeout: tsValidateOptionalAnyNumber,
	concurrency: tsValidateOptionalAnyNumber,
	minInstances: tsValidateOptionalAnyNumber,
	maxInstances: tsValidateOptionalAnyNumber,
};

// Validator for FunctionConfig
const functionConfigValidator = {
	name: tsValidateAnyString,
	trigger: tsValidateValue(['http', 'schedule', 'eventarc']),
	schedule: tsValidateOptionalAnyString,
	serviceAccountName: tsValidateOptionalAnyString,
	resources: tsValidateOptionalObject(functionResourceConfigValidator),
};

// Validator for functions array: accepts either string[] or FunctionConfig[]
// Uses custom validator to check type first, then validate accordingly
const functionItemValidator = (input?: string | FunctionConfig) => {
	if (typeof input === 'string') {
		// Legacy format: just a string (function name)
		return tsValidateResult(input, tsValidateAnyString);
	}
	if (typeof input === 'object' && input !== null) {
		// New format: FunctionConfig object
		return tsValidateResult(input, tsValidateOptionalObject(functionConfigValidator));
	}
	return 'Function item must be either a string (function name) or an object (FunctionConfig)';
};

const functionsArrayValidator = tsValidate_OptionalArray(functionItemValidator);

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
		functions: functionsArrayValidator, // Required: non-empty array validated in process, accepts string[] or FunctionConfig[]
		containerDeployment: tsValidateOptionalObject(containerDeploymentValidator),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_FirebaseFunction_Class.tsValidator_FirebaseFunction);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext<UnitConfigJSON_FirebaseFunction>) {
		const outputDir = context.packageJson.publishConfig?.directory;

		const env = this.runtimeParams[BaiParam_SetEnv.keyName];
		const envUnitConfig = context.packageJson.unitConfig.envs[env];
		if (!envUnitConfig)
			throw new ImplementationMissingException(`Missing configuration for env: ${env}`);

		const envConfig = {
			defaultConfig: envUnitConfig.defaultConfig,
			envConfig: envUnitConfig.envConfig,
			projectId: envUnitConfig.projectId,
			isLocal: envUnitConfig.isLocal ?? env === 'local'
		};

		const {type, ...unitConfig} = context.packageJson.unitConfig;

		// Validate functions array is required and non-empty
		if (!unitConfig.functions || !Array.isArray(unitConfig.functions) || unitConfig.functions.length === 0) {
			throw new ImplementationMissingException(`Missing or empty 'functions' array in unit config for ${context.baseConfig.key}. Functions must be explicitly declared.`);
		}

		return new Unit_FirebaseFunctionsApp({
			...context.baseConfig,
			...Unit_FirebaseFunctionsApp.DefaultConfig_FirebaseFunction,
			...unitConfig,
			envConfig,
			isTopLevelApp: true,
			hasSelfHotReload: unitConfig.hasSelfHotReload ?? false,
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