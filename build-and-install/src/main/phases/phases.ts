import {BuildPhase, PackageBuildPhaseType_Package, PackageBuildPhaseType_PackageWithOutput} from '../logic/ProjectManager';
import {convertPackageJSONTemplateToPackJSON_Value} from '../logic/map-project-packages';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {CONST_FirebaseRC, CONST_PackageJSON, MemKey_Packages} from '../core/consts';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {
	__stringify,
	_keys,
	_logger_finalDate,
	_logger_getPrefix,
	_logger_timezoneOffset,
	BadImplementationException, BeLogged,
	currentTimeMillis,
	exists,
	filterDuplicates,
	flatArray,
	Hour,
	LogClient_MemBuffer,
	LogLevel,
	Minute,
	reduceToMap,
	Second,
	sleep,
	StaticLogger,
	TypedMap
} from '@nu-art/ts-common';
import {
	JSONVersion,
	Package,
	Package_FirebaseFunctionsApp,
	Package_FirebaseHostingApp,
	PackageType_FirebaseFunctionsApp,
	PackageType_FirebaseHostingApp,
	PackageType_InfraLib,
	RuntimePackage_WithOutput
} from '../core/types';
import {
	createFirebaseRC,
	writeToFile_functionFirebaseConfigJSON,
	writeToFile_FunctionFirebaseJSON,
	writeToFile_HostingFirebaseConfigJSON,
	writeToFile_HostingFirebaseJSON
} from '../core/package/generate';
import {NVM} from '@nu-art/commando/cli/nvm';
import {AllBaiParams, RuntimeParams} from '../core/params/params';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {PNPM} from '@nu-art/commando/cli/pnpm';
import {BaseCliParam} from '@nu-art/commando/cli/cli-params';
import * as chokidar from 'chokidar';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, MemKey_DefaultFiles,} from '../defaults/consts';
import {MemKey_ProjectManager} from '../project-manager';
import {MemKey_ProjectScreen} from '../screen/ProjectScreen';
import {Commando} from '@nu-art/commando/core/cli';
import {RunningProcessLogs} from '../screen/RunningProcessLogs';


const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ThunderstormDependencyKey = 'THUNDERSTORM_DEPENDENCY_VERSION';
const CONST_ProjectVersionKey = 'APP_VERSION';
const CONST_ProjectDependencyKey = 'APP_VERSION_DEPENDENCY';
const CONST_TS_Config = `tsconfig.json`;
const CONST_RunningRoot = process.cwd();
const CONST_VersionApp = 'version-app.json';

const pathToProjectTS_Config = convertToFullPath(`./.config/${CONST_TS_Config}`);
const pathToProjectEslint = convertToFullPath('./.config/.eslintrc.js');
const runInDebug = false;
const CommandoLibs = ['commando', 'build-and-install', 'ts-common'];

export const Phase_PrintHelp: BuildPhase = {
	type: 'project',
	name: 'printHelp',
	terminatingPhase: true,
	filter: async () => RuntimeParams.help,
	action: async () => {
		const commando = NVM.createCommando(Cli_Basic);
		commando.append('echo "Build and install parameters:"');

		//Resolve all params by group
		const paramsByGroup: TypedMap<BaseCliParam<string, any>[]> = reduceToMap(AllBaiParams, param => param.group ?? 'No Group', (item, index, mapper) => {
			mapper[item.group ?? 'No Group'] = [...mapper[item.group ?? 'No Group'] ?? [], item];
			return mapper[item.group ?? 'No Group'];
		});

		_keys(paramsByGroup).map(paramGroup => {
			commando.append(`echo "${paramGroup}:" \n`);
			paramsByGroup[paramGroup].map(param => {
				commando.append(`echo "\n	${param.keys.join(' | ')} \n \t\t${param.description.trim().split('\n').join('\n\t\t')} \n"`);
			});
		});

		return commando.execute();
	}
};

export const Phase_SetWithThunderstorm: BuildPhase = {
	type: 'project',
	name: 'with-ts-home',
	isMandatory: true,
	action: async () => {
		// set value of the running with infra flag
		if (RuntimeParams.runWithThunderstorm)
			return;

		// Remove all the infra packages from the runtime project
		const packages = MemKey_Packages.get();
		const filter = (pkg: Package) => pkg.type !== PackageType_InfraLib || (RuntimeParams.withCommando && CommandoLibs.includes(pkg.name));

		packages.packages = packages.packages.filter(filter);
		packages.packagesDependency = packages.packagesDependency?.map(_packageArray => _packageArray.filter(filter));

		const projectScreen = MemKey_ProjectScreen.get();
		if (!projectScreen.packageData.length) {
			packages.packagesDependency.map(packages => packages.map(pkg => projectScreen.updateOrCreatePackage(pkg.name, 'Initiated')));
		}
	}
};

export const Phase_SetupProject: BuildPhase = {
	type: 'project',
	name: 'setup-project',
	isMandatory: true,
	action: async () => {
		const thunderstormVersionJson = require(convertToFullPath('./version-thunderstorm.json')) as JSONVersion;
		const packages = MemKey_Packages.get();

		packages.params[CONST_ThunderstormVersionKey] = thunderstormVersionJson.version;
		packages.params[CONST_ThunderstormDependencyKey] = `~${thunderstormVersionJson.version}`;

		const projectVersionJson = require(convertToFullPath('./version-app.json')) as JSONVersion;
		packages.params[CONST_ProjectVersionKey] = projectVersionJson.version;
		packages.params[CONST_ProjectDependencyKey] = projectVersionJson.version;
	}
};

export const Phase_PrepareParams: BuildPhase = {
	type: 'package',
	name: 'prepare-params',
	isMandatory: true,
	breakAfterPhase: true,
	mandatoryPhases: [Phase_SetupProject, Phase_SetWithThunderstorm],
	action: async (pkg) => {
		const packages = MemKey_Packages.get();
		const projectScreen = MemKey_ProjectScreen.get();

		projectScreen.updateOrCreatePackage(pkg.name, 'Preparing Pramas');
		// with workspace: *
		const tempPackageJson = convertPackageJSONTemplateToPackJSON_Value(pkg.packageJsonTemplate, (value, key) => {
			const toRet = packages.params[key!] ? 'workspace:*' : packages.params[value];
			return toRet;
		});

		// placed package name to version
		packages.params[tempPackageJson.name] = tempPackageJson.version;
		packages.params[`${tempPackageJson.name}_path`] = `file:.dependencies/${pkg.name}`;
		projectScreen.updateOrCreatePackage(pkg.name, 'Pramas Prepared');
	}
};

export const Phase_ResolveTemplate: BuildPhase = {
	type: 'package',
	name: 'resolve-template',
	isMandatory: true,
	mandatoryPhases: [Phase_PrepareParams, Phase_SetupProject, Phase_SetWithThunderstorm],
	action: async (pkg) => {
		const packages = MemKey_Packages.get();
		const projectScreen = MemKey_ProjectScreen.get();

		projectScreen.updateOrCreatePackage(pkg.name, 'Resolving Templates');
		// with workspace: *
		pkg.packageJsonWorkspace = convertPackageJSONTemplateToPackJSON_Value(pkg.packageJsonTemplate, (value, key) => {
			const toRet = packages.params[key!] ? 'workspace:*' : packages.params[value];
			return toRet;
		});

		// placed package name to version
		packages.params[pkg.packageJsonWorkspace.name] = pkg.packageJsonWorkspace.version;
		packages.params[`${pkg.packageJsonWorkspace.name}_path`] = `file:.dependencies/${pkg.name}`;

		// with versions for all packages, for be output: file:.dependencies/${pkg.name}
		pkg.packageJsonOutput = convertPackageJSONTemplateToPackJSON_Value(pkg.packageJsonTemplate, (value, key) => {
			const toRet = packages.params[key!] ?? packages.params[value];
			return toRet;
		});

		pkg.packageJsonRuntime = convertPackageJSONTemplateToPackJSON_Value(pkg.packageJsonTemplate, (value, key) => {
			const toRet = packages.params[`${key}_path`] ?? packages.params[key!] ?? packages.params[value];
			return toRet;
		});

		// write final package.json to package root folder
		await _fs.writeFile(`${pkg.path}/${CONST_PackageJSON}`, JSON.stringify(pkg.packageJsonWorkspace, null, 2), {encoding: 'utf-8'});

		// write final package.json to package output folder
		if (pkg.type === 'sourceless')
			return;

		if (!fs.existsSync(pkg.output))
			await _fs.mkdir(pkg.output);

		projectScreen.updateOrCreatePackage(pkg.name, 'Resolved Templates');
	}
};

export const Phase_ResolveEnv: BuildPhase = {
	type: 'package',
	name: 'resolve-env',
	isMandatory: true,
	mandatoryPhases: [Phase_ResolveTemplate, Phase_PrepareParams, Phase_SetupProject, Phase_SetWithThunderstorm],
	filter: async (pkg) => pkg.type === 'firebase-functions-app' || pkg.type === 'firebase-hosting-app',
	action: async (pkg) => {
		const firebasePkg = pkg as Package_FirebaseHostingApp | Package_FirebaseFunctionsApp;
		await _fs.writeFile(`${firebasePkg.path}/${CONST_FirebaseRC}`, JSON.stringify(createFirebaseRC(firebasePkg, RuntimeParams.environment), null, 2), {encoding: 'utf-8'});
		const defaultFiles = MemKey_DefaultFiles.get();
		const projectScreen = MemKey_ProjectScreen.get();

		projectScreen.updateOrCreatePackage(pkg.name, 'Resolving Env');

		if (pkg.type === 'firebase-hosting-app') {
			await writeToFile_HostingFirebaseJSON(firebasePkg as Package_FirebaseHostingApp, RuntimeParams.environment);
			await writeToFile_HostingFirebaseConfigJSON(firebasePkg as Package_FirebaseHostingApp, RuntimeParams.environment);
		}

		if (pkg.type === 'firebase-functions-app') {
			const firebaseFunctionPkg = firebasePkg as Package_FirebaseFunctionsApp;
			const pathToFirebaseConfigFolder = `${firebaseFunctionPkg.path}/${firebaseFunctionPkg.envConfig.pathToFirebaseConfig}`;
			try {
				await _fs.access(pathToFirebaseConfigFolder);
			} catch (e: any) {
				await _fs.mkdir(pathToFirebaseConfigFolder, {recursive: true});
			}

			// if (firebasePkg.envConfig.ssl) {
			// 	const pathToProxyFile = `${firebaseFunctionPkg.path}/src/main/proxy.ts`;
			// 	let defaultFileContent = await _fs.readFile(defaultFiles.backend.proxy, {encoding: 'utf-8'});
			// 	defaultFileContent = defaultFileContent.replace(/SERVER_PORT/g, `${firebasePkg.envConfig.basePort}`);
			// 	defaultFileContent = defaultFileContent.replace(/PATH_TO_SSL_KEY/g, `${firebasePkg.envConfig.ssl?.pathToKey}`);
			// 	defaultFileContent = defaultFileContent.replace(/PATH_TO_SSL_CERTIFICATE/g, `${firebasePkg.envConfig.ssl?.pathToCertificate}`);
			// 	await _fs.writeFile(pathToProxyFile, defaultFileContent, {encoding: 'utf-8'});
			// }

			await Promise.all(Const_FirebaseConfigKeys.map(async firebaseConfigKey => {
					const pathToConfigFile = `${pathToFirebaseConfigFolder}/${Const_FirebaseDefaultsKeyToFile[firebaseConfigKey]}`;
					try {
						await _fs.access(pathToConfigFile);
					} catch (e: any) {
						const defaultFileContent = await _fs.readFile(defaultFiles.firebaseConfig[firebaseConfigKey], {encoding: 'utf-8'});
						await _fs.writeFile(pathToConfigFile, defaultFileContent, {encoding: 'utf-8'});
					}
				})
			);
			await writeToFile_functionFirebaseConfigJSON(firebaseFunctionPkg, RuntimeParams.environment);
			await writeToFile_FunctionFirebaseJSON(firebaseFunctionPkg, RuntimeParams.environment);
		}

		projectScreen.updateOrCreatePackage(pkg.name, 'Env Resolved');
	}
};

export const Phase_ResolvePackages: BuildPhase = {
	type: 'project',
	name: 'setup-packages',
	action: async () => {

	}
};

export const Phase_InstallNvm: BuildPhase = {
	type: 'project',
	name: 'install-nvm',
	mandatoryPhases: [Phase_ResolveEnv],
	action: async () => {
		const installed = await NVM.installRequiredVersionIfNeeded();
		if (!installed)
			return;

	}
};

export const Phase_PrintDependencyTree: BuildPhase = {
	type: PackageBuildPhaseType_Package,
	name: 'print-dependency-tree',
	terminatingPhase: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => {
		return RuntimeParams.dependencyTree && exists(pkg.packageJsonWorkspace);
	},
	action: async (pkg) => {
		return NVM.createCommando(Cli_Basic)
			.cd(pkg.path)
			.append(`mkdir -p ${CONST_RunningRoot}/.trash/dependencies`)
			.append(`pnpm list --depth 1000 > "${CONST_RunningRoot}/.trash/dependencies/${pkg.name}.txt"`)
			.execute();
	}
};

export const Phase_CheckCyclicImports: BuildPhase = {
	type: PackageBuildPhaseType_PackageWithOutput,
	name: 'check-cyclic-imports',
	terminatingPhase: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => RuntimeParams.checkCyclicImports,
	action: async (pkg) => {
		if (!pkg.output)
			return;

		return NVM.createCommando(Cli_Basic)
			.cd(pkg.path)
			.append(`npx madge --image "./imports-${pkg.name}.svg" --circular ${pkg.output}`)
			.execute();
	}
};

export const Phase_PrintEnv: BuildPhase = {
	type: 'project',
	name: 'print-env',
	terminatingPhase: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async () => RuntimeParams.printEnv,
	action: async () => {
		return NVM.createCommando(Cli_Basic)
			.append('npm -g list typescript eslint firebase-tools sort-package-json --depth=0')
			.append('echo "npm version:"; npm -v')
			.append('echo "node version:"; node -v')
			.append('echo "base version:"; bash --version')
			.execute();
	}
};

export const Phase_PackagePurge: BuildPhase = {
	type: PackageBuildPhaseType_PackageWithOutput,
	name: 'package-purge',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => fs.existsSync(pkg.output) && RuntimeParams.purge,
	action: async (pkg) => {
		const projectScreen = MemKey_ProjectScreen.get();

		//Update cli ui
		projectScreen.updateOrCreatePackage(pkg.name, 'Purging');

		//Perform the action
		await _fs.rm(pkg.output, {recursive: true, force: true});
	}
};

export const Phase_InstallGlobals: BuildPhase = {
	type: 'project',
	name: 'install-globals',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async () => RuntimeParams.installGlobals,
	action: async () => {
		const globalPackages = 'firebase-tools@latest ts-node@latest typescript@latest eslint@^8.0.0';
		await NVM.createCommando().append(`npm i -g ${globalPackages}`).execute();
	}
};

export const Phase_InstallPnpm: BuildPhase = {
	type: 'project',
	name: 'install-pnpm',
	mandatoryPhases: [Phase_ResolveEnv],
	action: async () => {
		await PNPM.install(NVM.createCommando());
	}
};

export const Phase_InstallPackages: BuildPhase = {
	type: 'project',
	name: 'install-packages',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async () => RuntimeParams.installPackages,
	action: async () => {
		const packages = MemKey_Packages.get();

		const listOfLibs = packages.packages
			.map(pkg => pkg.path.replace(`${process.cwd()}/`, '').replace(process.cwd(), '.'));

		await PNPM.createWorkspace(listOfLibs);
		await PNPM.installPackages(NVM.createCommando());
	}
};

export const Phase_Clean: BuildPhase = {
	type: PackageBuildPhaseType_PackageWithOutput,
	name: 'clean',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => RuntimeParams.clean,
	action: async (pkg) => {
		const projectScreen = MemKey_ProjectScreen.get();

		projectScreen.updateOrCreatePackage(pkg.name, 'Cleaning');
		if (!fs.existsSync(pkg.output))
			return;

		await _fs.rm(pkg.output, {recursive: true, force: true});
	}
};

export const Phase_Lint: BuildPhase = {
	type: 'package',
	name: 'lint',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => RuntimeParams.lint && pkg.type !== 'sourceless',
	action: async (pkg) => {
		const projectScreen = MemKey_ProjectScreen.get();

		projectScreen.updateOrCreatePackage(pkg.name, 'Linting');

		const folder = 'main';
		const sourceFolder = `${pkg.path}/src/${folder}`;
		return NVM.createCommando().append(`eslint --config ${pathToProjectEslint} --ext .ts --ext .tsx "${sourceFolder}"`).execute();
	}
};

export const Phase_Debug: BuildPhase = {
	type: 'project',
	name: 'debug',
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async () => RuntimeParams.debug,
	action: async () => {
		const packages = MemKey_Packages.get();
		StaticLogger.logInfo(JSON.stringify(packages, null, 2));
	}
};

const sourcesPaths: string[] = [];
const suffixes = [
	'ts',
	'tsx',
	'scss',
	'json',
	'svg',
];
const compileActions: { [path: string]: (deleteDist?: boolean) => Promise<void> } = {};
export const Phase_PrepareCompile: BuildPhase = {
	type: 'package',
	name: 'prepare-compile',
	isMandatory: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => pkg.type !== 'sourceless' && !RuntimeParams.noBuild,
	action: async (pkg) => {
		if (pkg.type === 'sourceless')
			return;

		const folder = 'main';
		const sourceFolder = `${pkg.path}/src/${folder}`;
		const projectScreen = MemKey_ProjectScreen.get();

		suffixes.forEach(suffix => {
			sourcesPaths.push(`${sourceFolder}/**/*.${suffix}`);
		});

		// --- HERE ---
		compileActions[sourceFolder] = async () => {
			const pathToLocalTsConfig = `${sourceFolder}/${CONST_TS_Config}`;
			projectScreen.updateOrCreatePackage(pkg.name, 'Compiling');
			const counter = timeCounter();

			const commando = NVM.createCommando(Cli_Basic);
			if (pkg.type === 'firebase-hosting-app') {
				commando
					.cd(pkg.path)
					.append(`ENV=${RuntimeParams.environment} npm run build`);
			} else {
				try {
					const otherFiles = [
						'json',
						'scss',
						'svg',
						'png',
						'jpg',
						'jpeg',
						'rules',
					];

					const command = `find . \\( -name ${otherFiles.map(suffix => `'*.${suffix}'`).join(' -o -name ')} \\) | cpio -pdm "${pkg.output}" > /dev/null`;
					await Commando.create(Cli_Basic)
						.cd(`${pkg.path}/src/main`)
						.append(command)
						.execute();
				} catch (e) {
					//
				}

				commando
					.append(`tsc -p "${pathToLocalTsConfig}" --rootDir "${sourceFolder}" --outDir "${pkg.output}"`);
			}

			await commando.execute();

			projectScreen.updateOrCreatePackage(pkg.name, `Compiled (${counter.format('mm:ss.zzz')})`);
		};
	}
};

export const Phase_PreCompile: BuildPhase = {
	type: 'package',
	name: 'pre-compile',
	isMandatory: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => {
		if (pkg.type === 'sourceless')
			return false;

		if (RuntimeParams.noBuild)
			return false;

		return fs.existsSync(`${pkg.path}/prebuild.sh`);
	},
	action: async (pkg) => {
		return NVM.createCommando(Cli_Basic)
			.cd(pkg.path)
			.append(`bash ${pkg.path}/prebuild.sh`).execute();
	}
};

export const Phase_Compile: BuildPhase = {
	type: 'package',
	name: 'compile',
	mandatoryPhases: [Phase_PrepareCompile],
	filter: async (pkg) => pkg.type !== 'sourceless' && !RuntimeParams.noBuild,
	action: async (pkg) => {
		const packages = MemKey_Packages.get();

		if (pkg.type === 'sourceless')
			return;

		const folder = 'main';
		const sourceFolder = `${pkg.path}/src/${folder}`;
		const pathToLocalTsConfig = `${sourceFolder}/${CONST_TS_Config}`;

		const pathToVersionAppJSON = `${CONST_RunningRoot}/${CONST_VersionApp}`;

		//copy version-app.json file
		const versionAppJSON = await _fs.readFile(pathToVersionAppJSON, {encoding: 'utf-8'});

		// only read if exists
		let inPackageTsConfig = '';
		if (fs.existsSync(pathToLocalTsConfig))
			inPackageTsConfig = await _fs.readFile(pathToLocalTsConfig, {encoding: 'utf-8'});

		const defaultPackageTsConfig = await _fs.readFile(pathToProjectTS_Config, {encoding: 'utf-8'});

		StaticLogger.logInfo(`Copying tsconfig: ${pathToProjectTS_Config} => ${pathToLocalTsConfig}`);
		if (!pkg.customTsConfig && inPackageTsConfig !== defaultPackageTsConfig) {
			await _fs.copyFile(pathToProjectTS_Config, pathToLocalTsConfig);
		}

		// --- HERE ---
		await _fs.writeFile(`${pkg.output}/${CONST_PackageJSON}`, JSON.stringify(pkg.packageJsonOutput, null, 2), {encoding: 'utf-8'});

		if (pkg.type === PackageType_FirebaseFunctionsApp || pkg.type === PackageType_FirebaseHostingApp)
			await _fs.writeFile(`${sourceFolder}/${CONST_VersionApp}`, versionAppJSON, {encoding: 'utf-8'});

		if (pkg.type === 'firebase-functions-app') {
			pkg.packageJsonRuntime!.main = pkg.packageJsonRuntime!.main.replace('dist/', '');
			pkg.packageJsonRuntime!.types = pkg.packageJsonRuntime!.types.replace('dist/', '');

			await _fs.writeFile(`${pkg.output}/${CONST_PackageJSON}`, JSON.stringify(pkg.packageJsonRuntime, null, 2), {encoding: 'utf-8'});
			const runTimePackages = filterDuplicates(packages.packagesDependency?.flat().filter(_pkg => {
				if (_pkg.name === pkg.name)
					return false;

				if (pkg.packageJsonOutput?.dependencies && !_keys(pkg.packageJsonOutput?.dependencies).includes(_pkg.packageJsonTemplate.name))
					return false;

				return _pkg.type !== 'sourceless';
			})!, __pkg => __pkg.name);

			if (runTimePackages) {
				for (const rtPack of runTimePackages) {
					if (!(rtPack as RuntimePackage_WithOutput).output)
						continue;

					const pkgOutputFolderAsDependency = `${pkg.output}/.dependencies/${rtPack.name}/`;
					await NVM.createCommando()
						.append(`mkdir -p ${pkgOutputFolderAsDependency}`)
						.append(`rsync -a --delete ${(rtPack as RuntimePackage_WithOutput).output}/ ${pkg.output}/.dependencies/${rtPack.name}/`)
						.execute();

					await _fs.writeFile(`${pkgOutputFolderAsDependency}/${CONST_PackageJSON}`, JSON.stringify(rtPack.packageJsonRuntime, null, 2), {encoding: 'utf-8'});
				}
			}
		}
		return compileActions[sourceFolder]();
	}
};

export const Phase_CompileWatch: BuildPhase = {
	type: 'project',
	name: 'compile-watch',
	terminatingPhase: true,
	mandatoryPhases: [Phase_PrepareCompile],
	filter: async () => RuntimeParams.watch,
	action: async () => {
		const watcher = chokidar.watch(sourcesPaths);
		const projectManager = MemKey_ProjectManager.get();
		const projectScreen = MemKey_ProjectScreen.get();
		const packages = MemKey_Packages.get();

		await MemKey_ProjectManager.get().updateRunningStatus({
				'phaseKey': 'compile-watch',
				'packageDependencyIndex': 0
			}
		);

		let controller: AbortController | undefined;
		let prevController: AbortController | undefined;

		const watchListener = async (path: string, deleteDist?: boolean) => {
			const libPath = _keys(compileActions).find(libPath => path.startsWith(libPath as string));
			if (!libPath)
				return console.error(`couldn't find lib to run for path: ${libPath}...\nListening on: ${__stringify(sourcesPaths, true)}`);

			const rtPackages = MemKey_Packages.get();
			const pkg = flatArray(rtPackages.packagesDependency).find(pkg => {
				return path.startsWith(pkg.path) && pkg.type !== 'sourceless';
			});
			if (deleteDist && pkg && 'output' in pkg)
				await _fs.rmdir(pkg.output);

			const packageIndex = rtPackages.packagesDependency.findIndex(packages => {
				return packages.some(pkg => path.startsWith(pkg.path) && pkg.type !== 'sourceless');
			});

			try {
				if (controller)
					controller.abort();

				prevController = controller;
				controller = new AbortController();
				await projectManager.executePhase('compile', {
					phaseKey: 'compile',
					packageDependencyIndex: packageIndex
				}, controller.signal);

				if (!prevController?.signal.aborted) {
					// reset all packages back to watching
					packages.packages.map(pkg => projectScreen.updateOrCreatePackage(pkg.name, 'Watching'));
					projectScreen.updateRunningPhase('compile-watch');
				}
			} catch (e: any) {
				StaticLogger.logError(e);
			}
		};

		return new Promise<void>((resolve, error) => {
			watcher
				.on('error', (error) => {
					StaticLogger.logError('Error while watching', error);
				})
				.on('ready', () => {
					StaticLogger.logInfo('Watching: ', sourcesPaths);
					packages.packages.map(pkg => projectScreen.updateOrCreatePackage(pkg.name, 'Watching'));

					watcher
						.on('add', (path) => {
							StaticLogger.logInfo(`New File added: ${path}`);
							watchListener(path);
						})
						.on('change', (path) => {
							StaticLogger.logInfo(`Detected changes in file: ${path}`);
							watchListener(path);
						})
						.on('unlinkDir', (path) => {
							StaticLogger.logInfo(`Deleted Directory: ${path}`);
							watchListener(path, true);
						})
						.on('unlink', (path) => {
							StaticLogger.logInfo(`File Deleted: ${path}`);
							watchListener(path, true);
						});
				});

			process.on('SIGINT', async (status) => {
				await watcher.close();
				await MemKey_ProjectManager.get().updateRunningStatus({
						'phaseKey': 'compile-watch',
						'packageDependencyIndex': 0
					}
				);
				process.exit(0);
				resolve();
			});
		});
	}
};

let runningAppsLogs: RunningProcessLogs;
let counter = 0;
export const Phase_Launch: BuildPhase = {
	type: 'package',
	name: 'launch',
	terminatingPhase: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => !!pkg.name.match(new RegExp(RuntimeParams.launch))?.[0] && (pkg.type === 'firebase-functions-app' || pkg.type === 'firebase-hosting-app'),
	action: async (pkg) => {
		const projectManager = MemKey_ProjectManager.get();
		const projectScreen = MemKey_ProjectScreen.get();
		if (!runningAppsLogs) {
			projectScreen.disable();
			projectManager.clearLogger();
			runningAppsLogs = new RunningProcessLogs();
			runningAppsLogs.enable();
		}

		const logClient = new LogClient_MemBuffer(pkg.name);
		logClient.setForTerminal();
		logClient.setComposer((tag: string, level: LogLevel): string => {
			_logger_finalDate.setTime(Date.now() - _logger_timezoneOffset);
			const date = _logger_finalDate.toISOString().replace(/T/, '_').replace(/Z/, '').substring(0, 23).split('_')[1];
			return `${date} ${_logger_getPrefix(level)}:  `;
		});

		logClient.setFilter((level, tag) => {
			return tag === pkg.name;
		});
		BeLogged.addClient(logClient);
		projectScreen.updateOrCreatePackage(pkg.name, 'Launching...');
		if (pkg.type === 'firebase-functions-app') {
			await sleep(1000 * counter++);
			const allPorts = Array.from({length: 10}, (_, i) => `${pkg.envConfig.basePort + i}`);
			const command = NVM.createInteractiveCommando(Cli_Basic)
				.setUID(pkg.name)
				.cd(pkg.path)
				.append(`nvm use`)
				.append(`array=($(lsof -ti:${allPorts.join(',')}))`)
				.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`);

			command.append(`firebase emulators:start --export-on-exit --import=.trash/data ${runInDebug ? `--inspect-functions ${pkg.envConfig.ssl}` : ''}`);
			runningAppsLogs.registerApp(pkg.name, logClient);
			return command
				.execute();
		}

		if (pkg.type === 'firebase-hosting-app') {
			runningAppsLogs.registerApp(pkg.name, logClient);

			return NVM.createInteractiveCommando(Cli_Basic)
				.setUID(pkg.name)
				.cd(pkg.path)
				.append(`array=($(lsof -ti:${[pkg.envConfig.basePort - 1].join(',')}))`)
				.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
				.append(`nvm use`)
				.append(`npm run start`)
				.execute();
		}

		projectScreen.updateOrCreatePackage(pkg.name, 'Died');
	}
};

export const Phase_DeployFrontend: BuildPhase = {
	type: 'package',
	name: 'deploy-frontend',
	terminatingPhase: false,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => {
		const match = !!pkg.name.match(new RegExp(RuntimeParams.deploy))?.[0];
		return match && pkg.type === 'firebase-hosting-app';
	},
	action: async (pkg) => {
		const projectScreen = MemKey_ProjectScreen.get();

		if (pkg.type !== 'firebase-hosting-app')
			throw new BadImplementationException(`Somehow got a non firebase hosting package here: ${__stringify(pkg)}`);

		projectScreen.updateOrCreatePackage(pkg.name, 'Deploying');
		const counter = timeCounter();

		await NVM.createCommando(Cli_Basic)
			.cd(pkg.path)
			.append(`firebase deploy --only hosting`)
			.execute();

		projectScreen.updateOrCreatePackage(pkg.name, `Deployed (${counter.format('mm:ss.zzz')})`);
	}
};

export const Phase_DeployBackend: BuildPhase = {
	type: 'package',
	name: 'deploy-functions',
	terminatingPhase: true,
	mandatoryPhases: [Phase_ResolveEnv],
	filter: async (pkg) => {
		const match = !!pkg.name.match(new RegExp(RuntimeParams.deploy))?.[0];
		return match && pkg.type === 'firebase-functions-app';
	},
	action: async (pkg) => {
		const projectScreen = MemKey_ProjectScreen.get();
		if (pkg.type !== 'firebase-functions-app')
			throw new BadImplementationException(`Somehow got a non firebase functions package here: ${__stringify(pkg)}`);

		projectScreen.updateOrCreatePackage(pkg.name, 'Deploying...');
		const counter = timeCounter();

		await NVM.createCommando(Cli_Basic)
			.cd(pkg.path)
			.append(`firebase --debug deploy --only functions --force`)
			.execute();

		projectScreen.updateOrCreatePackage(pkg.name, `Deployed (${counter.format('mm:ss.zzz')})`);
	}
};

function timeCounter() {
	const started = currentTimeMillis();
	return {
		dt: () => currentTimeMillis() - started,
		format: (format: string) => {
			let dt = currentTimeMillis() - started;
			const hours = Math.floor(dt / Hour);
			dt -= hours * Hour;

			const minutes = Math.floor(dt / Minute);
			dt -= minutes * Minute;

			const seconds = Math.floor(dt / Second);
			dt -= seconds * Second;

			const millis = dt;
			return format
				.replace('hh', String(hours).padStart(2, '0'))
				.replace('mm', String(minutes).padStart(2, '0'))
				.replace('ss', String(seconds).padStart(2, '0'))
				.replace('zzz', String(millis).padStart(3, '0'));
		}
	};
}