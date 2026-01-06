import {BaseCliParam, CliParams} from '@nu-art/commando/cli-params/types';
import {BadImplementationException, tsValidate, tsValidateRegexp} from '@nu-art/ts-common';


export const BaiParam_AllUnits: BaseCliParam<'allUnits', boolean> = {
	keys: ['--all-units', '-all'],
	keyName: 'allUnits',
	type: 'boolean',
	group: 'Build',
	description: 'By default only top level and their dependencies are included, using this flag will include ALL the units'
};

export const BaiParam_DependencyTree: BaseCliParam<'dependencyTree', boolean> = {
	keys: ['--dependency-tree', '-dt'],
	keyName: 'dependencyTree',
	type: 'boolean',
	group: 'General',
	description: 'Will print the projects packages dependencies tree into the .trash folder'
};


export const BaiParam_SetEnv: BaseCliParam<'environment', string> = {
	keys: ['--set-env', '-se'],
	keyName: 'environment',
	type: 'string',
	group: 'Build',
	initialValue: 'local',
	description: 'Will set the .config-${environment}.json as the current .config.json and prepare it as base 64 for local usage \ninput required: envName(string)'
};

export const BaiParam_Install: BaseCliParam<'install', boolean> = {
	keys: ['--install', '-i'],
	keyName: 'install',
	type: 'boolean',
	group: 'Build',
	description: 'Will run \'pnpm install\' on entire project and will install global packages'
};

export const BaiParam_Clean: BaseCliParam<'clean', boolean> = {
	keys: ['--clean', '-c'],
	keyName: 'clean',
	type: 'boolean',
	group: 'Clean',
	description: 'Will delete the output(dist) & test output(dist-test) folders in all project packages'
};

export const BaiParam_Purge: BaseCliParam<'purge', boolean> = {
	keys: ['--purge', '-p'],
	dependencies: [{param: BaiParam_Clean, value: true}, {param: BaiParam_Install, value: true}],
	keyName: 'purge',
	group: 'Clean',
	type: 'boolean',
	description: 'Will delete the node_modules folder in all project packages \nWill perform --clean --install'
};

export const BaiParam_Generate: BaseCliParam<'generate', boolean> = {
	keys: ['--generate', '-g'],
	keyName: 'generate',
	type: 'boolean',
	group: 'Build',
	description: 'Will generate sources in the apps if needed'
};

export const BaiParam_GenerateDocs: BaseCliParam<'generateDocs', boolean> = {
	keys: ['--generate-docs', '-docs'],
	keyName: 'generateDocs',
	type: 'boolean',
	group: 'Build',
	description: 'Would generate ts-docs documentation'
};

export const BaiParam_NoBuild: BaseCliParam<'noBuild', boolean> = {
	keys: ['--no-build', '-nb'],
	keyName: 'noBuild',
	group: 'Build',
	type: 'boolean',
	description: 'Skip the build and link steps',
};

export const BaiParam_Prepare: BaseCliParam<'prepare', boolean> = {
	keys: [],
	keyName: 'prepare',
	group: 'Build',
	type: 'boolean',
	initialValue: true,
	description: '-- internal param --'
};

export const BaiParam_DryRun: BaseCliParam<'dryRun', boolean> = {
	keys: ['--dry-run', '-dry', '--dryrun'],
	keyName: 'dryRun',
	group: 'Other',
	type: 'boolean',
	description: 'Do not perform any phase impl, only log the process'
};

export const BaiParam_Lint: BaseCliParam<'lint', boolean> = {
	keys: ['--lint'],
	keyName: 'lint',
	type: 'boolean',
	group: 'Build',
	description: 'Run lint on all the project packages'
};

export const BaiParam_Watch: BaseCliParam<'watch', boolean> = {
	keys: ['--watch', '-w'],
	keyName: 'watch',
	type: 'boolean',
	group: 'Build',
	description: 'will build and listen for changes in the libraries',
	dependencies: [{param: BaiParam_NoBuild, value: true}, {param: BaiParam_Prepare, value: false}, {param: BaiParam_AllUnits, value: true}]

};

export const BaiParam_WatchBuildTree: BaseCliParam<'watchBuildTree', boolean> = {
	keys: ['--watchBuildTree', '-wbt'],
	keyName: 'watchBuildTree',
	type: 'boolean',
	group: 'Build',
	description: 'Once watch triggers, will build the entire tree that depends on the libs that changed',
	dependencies: [{param: BaiParam_Watch, value: true}, {param: BaiParam_NoBuild, value: true}, {param: BaiParam_Prepare, value: false}]
};

export const BaiParam_continue: BaseCliParam<'continue', boolean> = {
	keys: ['--continue', '-con'],
	keyName: 'continue',
	type: 'boolean',
	group: 'Build',
	description: 'Will pick up where last build process failed',
	dependencies: [{param: BaiParam_Watch, value: false}]
};

export const BaiParam_Test: BaseCliParam<'test', boolean> = {
	keys: ['--test', '-t'],
	keyName: 'test',
	type: 'boolean',
	group: 'Test',
	description: 'Run the tests in all the project packages',
};

export const TestTypes = ['pure', 'firebase', 'ui', 'mobile'];
export type TestType = typeof TestTypes[number];
export const BaiParam_TestType: BaseCliParam<'testType', TestType[]> = {
	keys: ['--test-type', '-tt'],
	keyName: 'testType',
	type: 'string[]',
	isArray: true,
	group: 'Test',
	options: TestTypes,
	description: 'Run the tests in all the project packages',
	dependencies: [{param: BaiParam_Test, value: true}],
};

export const BaiParam_TestFile: BaseCliParam<'testFiles', string[]> = {
	keys: ['--test-file', '-tf'],
	keyName: 'testFiles',
	type: 'string[]',
	isArray: true,
	group: 'Test',
	description: 'Run the specified test files',
	dependencies: [{param: BaiParam_Test, value: true}],
};

export const BaiParam_TestCase: BaseCliParam<'testCases', string[]> = {
	keys: ['--test-case', '-tc'],
	keyName: 'testCases',
	type: 'string[]',
	isArray: true,
	group: 'Test',
	description: 'Run only the specified test cases',
	dependencies: [{param: BaiParam_Test, value: true}],
};

export const BaiParam_TestDebugPort: BaseCliParam<'testDebugPort', number> = {
	keys: ['--test-debug', '-td'],
	keyName: 'testDebugPort',
	type: 'number',
	group: 'Test',
	defaultValue: 8010,
	description: 'If provided will allow a debugger connection on the specified port, and will run the tests in watch mode',
	dependencies: [{param: BaiParam_Test, value: true}],
};

export const BaiParam_Launch: BaseCliParam<'launch', boolean> = {
	keys: ['--launch', '-l'],
	keyName: 'launch',
	type: 'boolean',
	group: 'Apps',
	description: 'Will perform the launch phast on packages that supports it. use the --use-package flag to filter out for specific packages'
};

export const BaiParam_DebugBackend: BaseCliParam<'debugBackend', boolean> = {
	keys: ['--debug-backend', '-lbd'],
	keyName: 'debugBackend',
	type: 'boolean',
	group: 'Apps',
	description: 'Will add the app backend to the launch list - in debug mode'
};

export const BaiParam_Deploy: BaseCliParam<'deploy', boolean> = {
	keys: ['--deploy', '-dep'],
	keyName: 'deploy',
	type: 'boolean',
	group: 'Apps',
	description: 'Will perform the deploy phast on packages that supports it. use the --use-package flag to filter out for specific packages',
	dependencies: [
		{param: BaiParam_Launch, value: false},
		{param: BaiParam_Watch, value: false},
		{param: BaiParam_WatchBuildTree, value: false},
		{param: BaiParam_GenerateDocs, value: false},
	]
};

// Docker image tag validation: alphanumeric with dots, underscores, hyphens
// Cannot start with period or hyphen, max 128 characters
// Pattern: starts with alphanumeric, followed by 0-127 more alphanumeric/separator chars
const imageTagRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export const BaiParam_BuildPushImage: BaseCliParam<'buildPushImage', string> = {
	keys: ['--build-push-image', '-bpi'],
	keyName: 'buildPushImage',
	type: 'string',
	group: 'Deployment',
	description: 'Build Docker container image and push to Artifact Registry. Usage: --build-push-image <tag>',
	process: (value) => {
		if (!value)
			throw new BadImplementationException('Image tag is required. Use --build-push-image=<tag>');

		tsValidate(value, tsValidateRegexp(imageTagRegex, true));
		return value;
	},
};

export const BaiParam_DeployImage: BaseCliParam<'deployImage', string> = {
	keys: ['--deploy-image', '-di'],
	keyName: 'deployImage',
	type: 'string',
	group: 'Deployment',
	description: 'Deploy container image from Artifact Registry to Firebase Functions. Usage: --deploy-image <tag>',
	process: (value) => {
		if (!value)
			throw new BadImplementationException('Image tag is required. Use --deploy-image=<tag>');
		tsValidate(value, tsValidateRegexp(imageTagRegex, true));
		return value;
	},
	dependencies: [
		{param: BaiParam_BuildPushImage, value: (currentValue: string) => currentValue}, // Auto-enable build+push with same tag when deploy is requested
	]
};

export const BaiParam_DeployFunction: BaseCliParam<'deployFunction', string> = {
	keys: ['--deploy-function', '-df'],
	keyName: 'deployFunction',
	type: 'string',
	group: 'Deployment',
	description: 'Deploy a specific function by name. Usage: --deploy-function <functionName>',
	process: (value) => {
		if (!value)
			throw new BadImplementationException('Function name is required. Use --deploy-function=<functionName>');
		// Function name validation - just ensure it's a non-empty string
		if (typeof value !== 'string' || value.trim().length === 0)
			throw new BadImplementationException('Function name must be a non-empty string');
		return value;
	},
};

export const BaiParam_DeleteFunctions: BaseCliParam<'deleteFunctions', boolean> = {
	keys: ['--delete-functions'],
	keyName: 'deleteFunctions',
	type: 'boolean',
	group: 'Deployment',
	description: 'Delete functions before deployment. Behavior depends on other flags.',
};

export const BaiParam_DeleteFunction: BaseCliParam<'deleteFunction', string> = {
	keys: ['--delete-function', '-delfn'],
	keyName: 'deleteFunction',
	type: 'string',
	group: 'Deployment',
	description: 'Delete a specific function by name before deployment. Usage: --delete-function=<functionName>',
	process: (value) => {
		if (!value)
			throw new BadImplementationException('Function name is required. Use --delete-function=<functionName>');
		// Function name validation - just ensure it's a non-empty string
		if (typeof value !== 'string' || value.trim().length === 0)
			throw new BadImplementationException('Function name must be a non-empty string');
		return value;
	},
	dependencies: [{param: BaiParam_DeleteFunctions, value: true}]
};

export const BaiParam_Debug: BaseCliParam<'debug', boolean> = {
	keys: ['--debug', '-d'],
	keyName: 'debug',
	group: 'Other',
	type: 'boolean',
	description: 'Will print the parameters the script is running with'
};

export const BaiParam_DebugLifecycle: BaseCliParam<'debugLifecycle', boolean> = {
	keys: ['--debug-lifecycle', '-dl'],
	keyName: 'debugLifecycle',
	group: 'Other',
	type: 'boolean',
	description: 'Will only print the run config and die'
};

export const BaiParam_Verbose: BaseCliParam<'verbose', boolean> = {
	keys: ['--verbose', '-v'],
	keyName: 'verbose',
	group: 'Other',
	type: 'boolean',
	description: 'Set log level to verbose'
};

export const BaiParam_QuickDeploy: BaseCliParam<'quickDeploy', boolean> = {
	keys: ['--quick-deploy', '-qd'],
	keyName: 'quickDeploy',
	type: 'boolean',
	group: 'Other',
	description: 'Will perform the deploy phase without other lifecycle options',
	dependencies: [
		...BaiParam_Deploy.dependencies!,
		{param: BaiParam_Purge, value: false},
		{param: BaiParam_Lint, value: false},
		{param: BaiParam_Test, value: false},
		{param: BaiParam_NoBuild, value: true},
	]
};

type PromoteType = 'patch' | 'minor' | 'major';
export const BaiParam_Publish: BaseCliParam<'publish', PromoteType> = {
	keys: ['--publish'],
	keyName: 'publish',
	type: 'string',
	group: 'Other',
	options: ['patch', 'minor', 'major'],
	defaultValue: 'patch',
	description: 'Will publish to NPM any package that is not marked as private in its __package.json   \nenum options: patch | minor | major \nDefault Param: patch',
	process: (part) => part as PromoteType ?? 'patch'
};

export const BaiParam_UsePackage: BaseCliParam<'usePackage', string[]> = {
	keys: ['-up', '--use-packages'],
	keyName: 'usePackage',
	type: 'string[]',
	group: 'Other',
	description: 'Will specify units to process',
	process: (value) => {
		if (!value)
			return [];

		return value!.split(',').map(str => str.trim());
	},
	dependencies: [{param: BaiParam_AllUnits, value: true}]
};

export const BaiParam_BuildTree: BaseCliParam<'buildTree', boolean> = {
	keys: ['--build-tree', '-bt'],
	keyName: 'buildTree',
	type: 'boolean',
	group: 'Build',
	description: 'When used with -up, makes all transitive dependencies active (compile/test them too)',
};

export const BaiParam_Apps: BaseCliParam<'includeApps', string[]> = {
	keys: ['-app', '--application'],
	keyName: 'includeApps',
	type: 'string[]',
	group: 'Build',
	description: 'Will include the applications and all their dependency units to the build process',
	process: (value) => {
		if (!value)
			return [];

		return value!.split(',').map(str => str.trim());
	},
	isArray: true,
	dependencies: [
		{param: BaiParam_UsePackage, value: (currentValue: string[]) => currentValue},
		{param: BaiParam_BuildTree, value: true}
	]
};

export const BaiParam_ToESM: BaseCliParam<'toESM', boolean> = {
	keys: ['-tesm', '--to-esm'],
	keyName: 'toESM',
	type: 'boolean',
	group: 'Other',
	description: 'Will migrate existing CJS code to ESM',
	dependencies: [{param: BaiParam_AllUnits, value: true}]
};

export const BaiParam_Simulate: BaseCliParam<'simulation', boolean> = {
	keys: ['--simulate', '-sim', '--simulation'],
	keyName: 'simulation',
	type: 'boolean',
	group: 'Other',
	description: 'In combination with other params, will not perform the outbound operation, but instead simulate it',
	dependencies: [{param: BaiParam_AllUnits, value: true}]
};

export const BaiParam_CheckCyclicImports: BaseCliParam<'checkCyclicImports', boolean> = {
	keys: ['--check-cyclic-imports', '-cci'],
	keyName: 'checkCyclicImports',
	type: 'boolean',
	group: 'General',
	description: 'will check for cyclic imports and render an svg with the import graph',
	dependencies: [
		{param: BaiParam_NoBuild, value: true},
		{param: BaiParam_Launch, value: false},
		{param: BaiParam_Install, value: false},
		{param: BaiParam_Deploy, value: false},
		{param: BaiParam_Publish, value: false},
		{param: BaiParam_Purge, value: false},
		{param: BaiParam_Clean, value: false},
	]
};

export const BaiParam_ExtractDynamicDeps: BaseCliParam<'extractDynamicDeps', boolean> = {
	keys: ['--extract-dynamic-deps', '-edd'],
	keyName: 'extractDynamicDeps',
	type: 'boolean',
	group: 'Build',
	description: 'Extract dynamic dependencies from TypeScript files and write to _dynamic-deps.json',
	dependencies: [{param: BaiParam_AllUnits, value: true}]
};

export const BaiParam_MapExports: BaseCliParam<'mapExports', boolean> = {
	keys: ['--map-exports', '-me'],
	keyName: 'mapExports',
	type: 'boolean',
	group: 'Build',
	description: 'Map all exported symbols from TypeScript files and write to _export-for-import.json',
	dependencies: [{param: BaiParam_AllUnits, value: true}]
};

export const BaiParam_IndicesMcpServer: BaseCliParam<'indicesMcpServer', boolean> = {
	keys: ['--indices-mcp-server', '-imcp'],
	keyName: 'indicesMcpServer',
	type: 'boolean',
	group: 'Launch',
	description: 'Start Export Indices MCP server for export index queries'
};

export const BaiParam_IndicesMcpPort: BaseCliParam<'indicesMcpPort', number> = {
	keys: ['--indices-mcp-port'],
	keyName: 'indicesMcpPort',
	type: 'number',
	group: 'Launch',
	description: 'Port for Export Indices MCP server (default: 3001)',
	dependencies: [{param: BaiParam_IndicesMcpServer, value: true}]
};

export const AllBaiParams = [
	BaiParam_AllUnits,
	BaiParam_DependencyTree,
	BaiParam_CheckCyclicImports,

	BaiParam_Purge,
	BaiParam_Clean,
	BaiParam_continue,
	BaiParam_Prepare,
	BaiParam_SetEnv,
	BaiParam_Install,
	BaiParam_Generate, // TODO: to implement
	BaiParam_GenerateDocs,// TODO: to implement
	BaiParam_NoBuild,
	BaiParam_Apps,
	BaiParam_DryRun,
	BaiParam_Lint,
	BaiParam_Watch,
	BaiParam_WatchBuildTree,
	BaiParam_Test,
	BaiParam_TestType,
	BaiParam_TestFile,
	BaiParam_TestCase,
	BaiParam_TestDebugPort,
	BaiParam_Launch,
	BaiParam_Deploy,
	BaiParam_BuildPushImage,
	BaiParam_DeployImage,
	BaiParam_DeployFunction,
	BaiParam_DeleteFunctions,
	BaiParam_DeleteFunction,
	BaiParam_DebugBackend,

	BaiParam_Debug,
	BaiParam_Verbose,
	BaiParam_Publish,
	BaiParam_UsePackage,
	BaiParam_ToESM,
	BaiParam_Simulate,
	BaiParam_BuildTree,
	BaiParam_ExtractDynamicDeps,
	BaiParam_MapExports,
	BaiParam_IndicesMcpServer,
	BaiParam_IndicesMcpPort,
	BaiParam_DebugLifecycle
];

export type BaiParams = CliParams<typeof AllBaiParams>;

