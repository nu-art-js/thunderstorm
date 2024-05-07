import {BaseCliParam, CLIParams_Resolver} from '@nu-art/commando/cli/cli-params';


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

export const BaiParam_Purge: BaseCliParam<'purge', boolean> = {
	keys: ['--purge', '-p'],
	keyName: 'purge',
	group: 'Clean',
	type: 'boolean',
	description: 'Will delete the node_modules folder in all project packages \nWill perform --clean --install'
};

export const BaiParam_Clean: BaseCliParam<'clean', boolean> = {
	keys: ['--clean', '-c'],
	keyName: 'clean',
	type: 'boolean',
	group: 'Clean',
	description: 'Will delete the output(dist) & test output(dist-test) folders in all project packages'
};

export const BaiParam_continue: BaseCliParam<'continue', boolean> = {
	keys: ['--continue', '-con'],
	keyName: 'continue',
	type: 'boolean',
	group: 'Build',
	description: 'Will pick up where last build process failed'
};

export const BaiParam_UsePackage: BaseCliParam<'usePackage', string> = {
	keys: ['--use-package', '-up'],
	keyName: 'usePackage',
	type: 'string',
	group: 'Build',
	description: 'Would ONLY run the script in the context of the specified project packages \nvalue required: project-package-folder(string)'
};

export const BaiParam_ProjectLibs: BaseCliParam<'projectLibs', boolean> = {
	keys: ['--project-libs', '-pl'],
	keyName: 'projectLibs',
	type: 'boolean',
	group: 'Build',
	description: 'Would ONLY run the script in the context of the project libs'
};

export const BaiParam_SetEnv: BaseCliParam<'setEnv', string> = {
	keys: ['--set-env', '-se'],
	keyName: 'setEnv',
	type: 'string',
	group: 'Build',
	defaultValue: 'local',
	description: 'Will set the .config-${environment}.json as the current .config.json and prepare it as base 64 for local usage \ninput required: envName(string)'
};

export const BaiParam_FallbackEnv: BaseCliParam<'fallbackEnv', string> = {
	keys: ['--fallback-env', '-fe'],
	keyName: 'fallbackEnv',
	type: 'string',
	group: 'Build',
	description: 'When setting env some of the files might be missing and would fallback to the provided env \ninput required: envName(string)'
};

export const BaiParam_Setup: BaseCliParam<'setup', boolean> = {
	keys: ['--setup', '-s'],
	keyName: 'setup',
	type: 'boolean',
	group: 'Build',
	description: '--setup / -s are deprecated... use --install or -i'
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

export const BaiParam_Generate: BaseCliParam<'generate', boolean> = {
	keys: ['--generate', '-g'],
	keyName: 'generate',
	type: 'boolean',
	group: 'Build',
	description: 'Will generate sources in the apps if needed'
};

export const BaiParam_CleanEnv: BaseCliParam<'cleanEnv', boolean> = {
	keys: ['--clean-env', '-cenv'],
	keyName: 'cleanEnv',
	type: 'boolean',
	group: 'Build',
	description: 'will clean env'
};

export const BaiParam_Link: BaseCliParam<'link', boolean> = {
	keys: ['--link', '-ln'],
	keyName: 'link',
	type: 'boolean',
	group: 'Build',
	description: 'Would link dependencies between project packages'
};

export const BaiParam_GenerateDocs: BaseCliParam<'generateDocs', boolean> = {
	keys: ['--generate-docs', '-docs'],
	keyName: 'generateDocs',
	type: 'boolean',
	group: 'Build',
	description: 'Would generate ts-docs documentation'
};

export const BaiParam_LinkOnly: BaseCliParam<'linkOnly', boolean> = {
	keys: ['--linkOnly', '-lo'],
	keyName: 'linkOnly',
	group: 'Build',
	type: 'boolean',
	description: 'Would ONLY link dependencies between project packages'
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

export const BaiParam_ThunderstormHome: BaseCliParam<'thunderstormHome', boolean> = {
	keys: ['--thunderstorm-home', '-th'],
	keyName: 'thunderstormHome',
	type: 'boolean',
	group: 'Build',
	description: 'Will link the output folder of the libraries of thunderstorm that exists under the give path \nMUST have ThunderstormHome env variable defined and point to the Thunderstorm sample project'
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

export const BaiParam_OutputDir: BaseCliParam<'outputDir', string> = {
	keys: ['--output-dir', '-od'],
	keyName: 'outputDir',
	type: 'string',
	group: 'Build',
	description: 'Set the output dir name/path (default: dist) \nrequired input: path-to-output-folder (string)'
};

export const BaiParam_CheckImports: BaseCliParam<'checkImports', boolean> = {
	keys: ['--check-imports', '-ci'],
	keyName: 'checkImports',
	type: 'boolean',
	group: 'Build',
	description: 'Will check for circular import in files...'
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
	defaultValue: '.*'
};

export const BaiParam_Account: BaseCliParam<'account', string> = {
	keys: ['--account', '-a'],
	keyName: 'account',
	type: 'string',
	group: 'Test',
	description: 'Run the tests in all the project packages \ninput required, path to firebase service account (string'
};

export const BaiParam_OutputTestDir: BaseCliParam<'outputTestDir', string> = {
	keys: ['--output-test-dir', '-otd'],
	keyName: 'outputTestDir',
	type: 'string',
	group: 'Test',
	description: 'Set the tests output dir name/path (default: dist-test) \ninput optional path to output folder'
};

export const BaiParam_Launch: BaseCliParam<'launch', string> = {
	keys: ['--launch', '-l'],
	keyName: 'launch',
	type: 'string',
	group: 'Apps',
	process: () => '.*',
	description: 'It will add the provided App to the launch list \nrequired input: path-to-app-to-launch(string)'
};

export const BaiParam_FileToLaunch: BaseCliParam<'fileToLaunch', string> = {
	keys: ['--file', '-f'],
	keyName: 'fileToLaunch',
	group: 'Apps',
	type: 'string',
	description: 'The file name to launch \ninput required: path-to-file(string)'
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
	keys: ['--deploy', '-d'],
	keyName: 'deploy',
	type: 'string',
	group: 'Apps',
	process: () => '.*',
	description: 'Will add the provided App to the deploy list or all applications'
};

export const BaiParam_DeployBackend: BaseCliParam<'deployBackend', boolean> = {
	keys: ['--deploy-backend', '-db'],
	keyName: 'deployBackend',
	group: 'Apps',
	type: 'boolean',
	description: 'Will add the app-backend to the deploy list'
};

export const BaiParam_DeployFrontend: BaseCliParam<'deployFrontend', boolean> = {
	keys: ['--deploy-frontend', '-df'],
	keyName: 'deployFrontend',
	type: 'boolean',
	group: 'Apps',
	description: 'Will add the app frontend to the deploy list'
};

export const BaiParam_SetVersion: BaseCliParam<'setVersion', string> = {
	keys: ['--set-version', '-sv'],
	keyName: 'setVersion',
	type: 'string',
	group: 'Apps',
	description: 'Set application version before deploy \ninput required: in the following structure: x.y.z (string)'
};

export const BaiParam_NoGit: BaseCliParam<'noGit', boolean> = {
	keys: ['--no-git'],
	keyName: 'noGit',
	type: 'boolean',
	group: 'Other',
	description: '',
};

export const BaiParam_DebugTranspiler: BaseCliParam<'debugTranspiler', boolean> = {
	keys: ['--debug-transpiler', '-dt'],
	keyName: 'debugTranspiler',
	type: 'boolean',
	group: 'Other',
	description: ''
};

export const BaiParam_Debug: BaseCliParam<'debug', boolean> = {
	keys: ['--debug'],
	keyName: 'debug',
	group: 'Other',
	type: 'boolean',
	description: 'Will print the parameters the script is running with'
};

export const BaiParam_Debugger: BaseCliParam<'debugger', boolean> = {
	keys: ['--debugger'],
	keyName: 'debugger',
	group: 'Other',
	type: 'boolean',
	description: 'Will stop at break points'
};

export const BaiParam_Log: BaseCliParam<'setLogLevel', string> = {
	keys: ['--log'],
	keyName: 'setLogLevel',
	group: 'Other',
	type: 'string',
	options: ['verbose', 'debug', 'info', 'warning', 'error'],
	description: 'Set the script log level \nEnum options: verbose | debug | info | warning | error \ndefault level: info'
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
	defaultValue: 'patch'
};

export const BaiParam_QuickPublish: BaseCliParam<'quickPublish', boolean> = {
	keys: ['--quick-publish', '-qp'],
	keyName: 'quickPublish',
	type: 'boolean',
	group: 'Other',
	description: 'Will publish thunderstorm without link clean lint and compile',
};

export const AllBaiParams = [
	BaiParam_Help,
	BaiParam_DependencyTree,
	BaiParam_CheckCyclicImports,
	BaiParam_PrintEnv,
	BaiParam_Purge,
	BaiParam_Clean,
	BaiParam_continue,
	BaiParam_UsePackage,
	BaiParam_ProjectLibs,
	BaiParam_SetEnv,
	BaiParam_FallbackEnv,
	BaiParam_Setup,
	BaiParam_Install,
	BaiParam_InstallPackages,
	BaiParam_InstallGlobals,
	BaiParam_Generate,
	BaiParam_CleanEnv,
	BaiParam_Link,
	BaiParam_GenerateDocs,
	BaiParam_LinkOnly,
	BaiParam_NoBuild,
	BaiParam_DryRun,
	BaiParam_ThunderstormHome,
	BaiParam_NoThunderstorm,
	BaiParam_Lint,
	BaiParam_OutputDir,
	BaiParam_CheckImports,
	BaiParam_Watch,
	BaiParam_Test,
	BaiParam_Account,
	BaiParam_OutputTestDir,
	BaiParam_Launch,
	BaiParam_FileToLaunch,
	BaiParam_LaunchFrontend,
	BaiParam_LaunchBackend,
	BaiParam_DebugBackend,
	BaiParam_Deploy,
	BaiParam_DeployBackend,
	BaiParam_DeployFrontend,
	BaiParam_SetVersion,
	BaiParam_NoGit,
	BaiParam_DebugTranspiler,
	BaiParam_Debug,
	BaiParam_Debugger,
	BaiParam_Log,
	BaiParam_QuickDeploy,
	BaiParam_Publish,
	BaiParam_QuickPublish,
];

export const RuntimeParams = CLIParams_Resolver.create(...AllBaiParams).resolveParamValue();