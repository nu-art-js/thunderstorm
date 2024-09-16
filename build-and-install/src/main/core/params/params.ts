import {BaseCliParam} from '@nu-art/commando/cli-params/types';
import {CLIParamsResolver} from '@nu-art/commando/cli-params/CLIParamsResolver';
import {exists} from '@nu-art/ts-common';

//util regex function
const regexTemplate = (regexp: string | undefined) => exists(regexp) ? `.*${regexp}.*` : '.*';

export const BaiParam_Help: BaseCliParam<'help', boolean> = {
	keys: ['--help', '-h'],
	keyName: 'help',
	type: 'boolean',
	group: 'General',
	description: 'This help menu'
};

export const BaiParam_DependencyTree: BaseCliParam<'dependencyTree', boolean> = {
	keys: ['--dependency-tree', '-dt'],
	keyName: 'dependencyTree',
	type: 'boolean',
	group: 'General',
	description: 'Will print the projects packages dependencies tree into the .trash folder'
};

export const BaiParam_CheckCyclicImports: BaseCliParam<'checkCyclicImports', boolean> = {
	keys: ['--check-cyclic-imports', '-cci'],
	keyName: 'checkCyclicImports',
	type: 'boolean',
	group: 'General',
	description: 'will check for cyclic imports and render an svg with the import graph'
};

export const BaiParam_PrintEnv: BaseCliParam<'printEnv', boolean> = {
	keys: ['--print-env'],
	keyName: 'printEnv',
	type: 'boolean',
	group: 'General',
	description: 'Will print the current versions of the important tools'
};

export const BaiParam_continue: BaseCliParam<'continue', boolean> = {
	keys: ['--continue', '-con'],
	keyName: 'continue',
	type: 'boolean',
	group: 'Build',
	description: 'Will pick up where last build process failed'
};

export const BaiParam_SetEnv: BaseCliParam<'environment', string> = {
	keys: ['--set-env', '-se'],
	keyName: 'environment',
	type: 'string',
	group: 'Build',
	defaultValue: 'local',
	description: 'Will set the .config-${environment}.json as the current .config.json and prepare it as base 64 for local usage \ninput required: envName(string)'
};

export const BaiParam_Setup: BaseCliParam<'setup', boolean> = {
	keys: ['--setup'],
	keyName: 'setup',
	type: 'boolean',
	group: 'Build',
	description: 'Setup local project for developer'
};

export const BaiParam_Install: BaseCliParam<'install', boolean> = {
	keys: ['--install', '-i'],
	keyName: 'install',
	type: 'boolean',
	group: 'Build',
	description: 'Will run \'npm install\' in all project packages \nWill perform --link'
};

export const BaiParam_InstallPackages: BaseCliParam<'installPackages', boolean> = {
	keys: ['--install-packages', '-ip'],
	keyName: 'installPackages',
	type: 'boolean',
	group: 'Build',
	description: 'Will run \'npm install\' in all project packages \nWill perform --link'
};

export const BaiParam_InstallGlobals: BaseCliParam<'installGlobals', boolean> = {
	keys: ['--install-globals', '-ig'],
	keyName: 'installGlobals',
	type: 'boolean',
	group: 'Build',
	description: 'Will install all global packages'
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
	dependencies: [{param: BaiParam_Clean, value: true}, {param: BaiParam_InstallPackages, value: true}],
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
	description: 'Skip the build and link steps'
};

export const BaiParam_DryRun: BaseCliParam<'dryRun', boolean> = {
	keys: ['--dry-run', '-dry', '--dryrun'],
	keyName: 'dryRun',
	group: 'Other',
	type: 'boolean',
	description: 'Do not perform any phase impl, only log the process'
};

export const BaiParam_RunWithThunderstorm: BaseCliParam<'runWithThunderstorm', boolean> = {
	keys: ['--with-thunderstorm', '-th'],
	keyName: 'runWithThunderstorm',
	type: 'boolean',
	group: 'Build',
	description: 'Will link the output folder of the libraries of thunderstorm that exists under the give path \nMUST have ThunderstormHome env variable defined and point to the Thunderstorm sample project'
};

export const BaiParam_WithCommando: BaseCliParam<'withCommando', boolean> = {
	keys: ['--with-commando', '-wc'],
	keyName: 'withCommando',
	type: 'boolean',
	group: 'Build',
	description: 'Build with local commando from ts'
};

export const BaiParam_NoThunderstorm: BaseCliParam<'noThunderstorm', boolean> = {
	keys: ['--no-thunderstorm', '-nth'],
	keyName: 'noThunderstorm',
	type: 'boolean',
	group: 'Build',
	description: 'Will remove the linkage and dependency on thunderstorm sources'
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
	description: 'will build and listen for changes in the libraries'
};

export const BaiParam_Test: BaseCliParam<'test', string> = {
	keys: ['--test', '-t'],
	keyName: 'test',
	type: 'string',
	group: 'Test',
	description: 'Run the tests in all the project packages\naccepts test label to run optionally. default will be empty string',
	process: regexTemplate,
};

export const BaiParam_Launch: BaseCliParam<'launch', string> = {
	keys: ['--launch', '-l'],
	keyName: 'launch',
	type: 'string',
	group: 'Apps',
	process: regexTemplate,
	description: 'It will add the provided App to the launch list \nrequired input: path-to-app-to-launch(string)'
};

export const BaiParam_LaunchFrontend: BaseCliParam<'launchFrontend', boolean> = {
	keys: ['--launch-frontend', '-lf'],
	keyName: 'launchFrontend',
	type: 'boolean',
	group: 'Apps',
	description: 'Will add the app-frontend to the launch list'
};

export const BaiParam_LaunchBackend: BaseCliParam<'launchBackend', boolean> = {
	keys: ['--launch-backend', '-lb'],
	keyName: 'launchBackend',
	group: 'Apps',
	type: 'boolean',
	description: 'Will add the app-backend to the launch list'
};

export const BaiParam_DebugBackend: BaseCliParam<'debugBackend', boolean> = {
	keys: ['--debug-backend', '-lbd'],
	keyName: 'debugBackend',
	type: 'boolean',
	group: 'Apps',
	description: 'Will add the app backend to the launch list - in debug mode'
};

export const BaiParam_Deploy: BaseCliParam<'deploy', string> = {
	keys: ['--deploy', '-dep'],
	keyName: 'deploy',
	type: 'string',
	group: 'Apps',
	process: regexTemplate,
	description: 'Will add the provided App to the deploy list or all applications'
};

export const BaiParam_DeployBackend: BaseCliParam<'deployBackend', string> = {
	keys: ['--deploy-backend', '-db'],
	keyName: 'deployBackend',
	group: 'Apps',
	type: 'string',
	process: regexTemplate,
	description: 'Will add the app-backend to the deploy list'
};

export const BaiParam_DeployFrontend: BaseCliParam<'deployFrontend', string> = {
	keys: ['--deploy-frontend', '-df'],
	keyName: 'deployFrontend',
	type: 'string',
	group: 'Apps',
	process: regexTemplate,
	description: 'Will add the app frontend to the deploy list'
};

export const BaiParam_NoGit: BaseCliParam<'noGit', boolean> = {
	keys: ['--no-git'],
	keyName: 'noGit',
	type: 'boolean',
	group: 'Other',
	description: '',
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
	keys: ['--verbose', '-d'],
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
	description: 'Will deploy both frontend & backend, without any other lifecycle action'
};

export const BaiParam_Publish: BaseCliParam<'publish', string> = {
	keys: ['--publish'],
	keyName: 'publish',
	type: 'string',
	group: 'Other',
	description: 'Will publish thunderstorm && promote thunderstorm version \nenum options: patch | minor | major \nDefault Param: patch',
	process: (part) => part ?? 'patch'
};

export const BaiParam_AllLogs: BaseCliParam<'allLogs', boolean> = {
	keys: ['--all-logs', '-al'],
	keyName: 'allLogs',
	type: 'boolean',
	group: 'UI',
	description: 'will disable ui and show verbose logs for bai run',
};

export const BaiParam_CloseScreenOnExit: BaseCliParam<'closeOnExit', boolean> = {
	keys: ['--close-on-exit', '-cox'],
	keyName: 'closeOnExit',
	type: 'boolean',
	group: 'UI',
	description: 'will close all the fancy screens once process is done',
};

export const BaiParam_EncounterManager: BaseCliParam<'encounterManager', boolean> = {
	keys: ['-em', '--encounter-manager'],
	keyName: 'encounterManager',
	type: 'boolean',
	group: 'Other',
	description: 'Will install encounter manager shit',
};

export const BaiParam_EncounterManagerListen: BaseCliParam<'encounterManagerListen', boolean> = {
	keys: ['-eml', '--encounter-manager-listen'],
	keyName: 'encounterManagerListen',
	type: 'boolean',
	group: 'Other',
	description: 'Will install encounter manager shit and launch after advisor and km',
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
	}
};

export const AllBaiParams = [
	BaiParam_Help,
	BaiParam_DependencyTree,
	BaiParam_CheckCyclicImports,
	BaiParam_PrintEnv,
	BaiParam_Purge,
	BaiParam_Clean,
	BaiParam_continue,
	BaiParam_SetEnv,
	BaiParam_Setup,
	BaiParam_Install,
	BaiParam_InstallPackages,
	BaiParam_InstallGlobals,
	BaiParam_Generate, // TODO: to implement
	BaiParam_GenerateDocs,// TODO: to implement
	BaiParam_NoBuild,
	BaiParam_DryRun,
	BaiParam_RunWithThunderstorm,
	BaiParam_WithCommando,
	BaiParam_NoThunderstorm,
	BaiParam_Lint,
	BaiParam_Watch,
	BaiParam_Test,// TODO: to implement
	BaiParam_Launch,
	BaiParam_LaunchFrontend,// TODO: to implement
	BaiParam_LaunchBackend,// TODO: to implement
	BaiParam_DebugBackend,
	BaiParam_Deploy,
	BaiParam_DeployBackend,
	BaiParam_DeployFrontend,
	BaiParam_NoGit, // TODO: to implement
	BaiParam_Debug,
	BaiParam_Verbose,
	BaiParam_Publish, // TODO: to implement
	BaiParam_AllLogs,
	BaiParam_CloseScreenOnExit,
	BaiParam_EncounterManager,
	BaiParam_EncounterManagerListen, BaiParam_UsePackage,
	BaiParam_DebugLifecycle
];

const params = CLIParamsResolver.create(...AllBaiParams).resolveParamValue();
export const RuntimeParams = params;
