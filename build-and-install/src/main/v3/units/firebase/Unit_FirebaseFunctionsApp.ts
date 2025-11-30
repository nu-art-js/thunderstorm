import {UnitPhaseImplementor} from '../../core/types.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_NodeModules, CONST_PackageJSON} from '../../../core/consts.js';
import {promises as _fs} from 'fs';
import {FirebasePackageConfig} from '../../../core/types/index.js';
import {__stringify, _logger_logPrefixes, deepClone, ImplementationMissingException, LogLevel, reduceObject, Second, sleep, StringMap} from '@nu-art/ts-common';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile} from '../../../defaults/consts.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Phase_Deploy, Phase_Launch} from '../../phase/index.js';
import {resolve} from 'path';
import {DEFAULT_OLD_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../Unit_TypescriptLib.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {deployLogFilter} from './common.js';

export const firebaseFunctionEmulator_ErrorStrings: string[] = [
	'functions: Failed',
];

export const firebaseFunctionEmulator_WarningStrings: string[] = [
	'⚠',
];

type EnvConfig = { defaultConfig?: string, envConfig?: string, projectId: string, isLocal?: boolean };
export type Unit_FirebaseFunctionsApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig?: FirebasePackageConfig;
	pathToFirebaseConfig: string,
	envConfig: EnvConfig
	ignore?: string[],
	debugPort: number,
	basePort: number,
	sslKey: string
	sslCert: string
	pathToEmulatorData: string
	sources?: string[];
};

// const CONST_VersionApp = 'version-app.json';


export class Unit_FirebaseFunctionsApp<C extends Unit_FirebaseFunctionsApp_Config = Unit_FirebaseFunctionsApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_Deploy]> {

	public functions: StringMap = {};

	static staggerCount: number = 0;
	static DefaultConfig_FirebaseFunction = {
		pathToFirebaseConfig: '.firebase_config',
		debugPort: 8100,
		basePort: 8102,
		sslKey: '.ssl/key.pem',
		sslCert: '.ssl/cert.pem',
		output: 'dist',
		pathToEmulatorData: '.trash/data',
	};

	readonly emulatorLogStrings = {
		error: firebaseFunctionEmulator_ErrorStrings,
		warning: firebaseFunctionEmulator_WarningStrings,
	};

	constructor(config: Unit_FirebaseFunctionsApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseFunctionsApp);
		this.logger.setLogTransformer(log => {
			const prefix = _logger_logPrefixes.find(prefix => log.includes(prefix));
			if (!prefix)
				return log;

			return log.substring(log.indexOf(prefix) + prefix.length);
		});
	}

	//######################### Phase Implementations #########################

	protected async copyPackageJSONToOutput() {
		const targetPath = resolve(this.config.output, CONST_PackageJSON);
		const packageJson = deepClone(this.config.packageJson);
		const distDependencies = this.deriveDistDependencies();
		packageJson.main = 'index.js';
		packageJson.types = 'index.d.ts';
		
		// Ensure dependencies object exists
		if (!packageJson.dependencies) {
			packageJson.dependencies = {};
		}

		// First, update existing dependencies (replace workspace:* with file: paths where applicable)
		const dependencies = reduceObject(packageJson.dependencies, packageJson.dependencies, (acc, key, value) => {
			acc[key] = distDependencies[key] ?? value;
			return acc;
		});

		// Then, add ALL dependencyUnits to the dependencies (this includes transitive dependencies)
		// This ensures the entire dependency tree is referenced in the main package.json
		this.dependencyUnits.forEach(unit => {
			dependencies[unit.config.key] = distDependencies[unit.config.key];
		});

		packageJson.dependencies = dependencies;

		await FileSystemUtils.file.template.write(targetPath, __stringify(packageJson, true), this.deriveDistDependencies(), DEFAULT_OLD_TEMPLATE_PATTERN);
	}

	async prepare() {
		await super.prepare();
		await FileSystemUtils.folder.list.forEach.folder(this.config.fullPath, async (path) => {
			if (path.replace(`${this.config.fullPath}/`, '').startsWith('firebase-export-'))
				return await FileSystemUtils.folder.delete(path);
		});
		await FileSystemUtils.folder.create(resolve(this.config.fullPath, this.config.pathToEmulatorData));
		await FileSystemUtils.file.delete(this.pathToProxy());

		await this.resolveConfigs();
	}

	async resolveConfigs() {
		await this.resolveFunctionsRC();
		await this.resolveConfigDir();
		await this.resolveFunctionsRuntimeConfig();
		await this.resolveFunctionsJSON();
	}

	async postCompile() {
		await this.createAppVersionFile();
		await this.createDependenciesDir();
	}

	async launch() {
		await sleep(2 * Second * Unit_FirebaseFunctionsApp.staggerCount++);
		await this.releaseEmulatorPorts();
		await Promise.all([
			this.runProxy(),
			this.runEmulator(),
		]);
	}

	async releaseEmulatorPorts() {
		const allPorts = Array.from({length: 10}, (_, i) => `${this.config.basePort + i}`);
		return this.releasePorts(allPorts);
	}

	async deploy() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.output)
			.ls()
			.cat('package.json')
			.cat('index.js')
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter)
			// example: Function URL (hello(us-central1)): https://hello-kv65k7yylq-uc.a.run.app
			.onLog(/.*Function URL.*?\((.*?)\(.*(https:\/\/.*?)$/, match => {
				this.functions[match[1]] = match[2];
			});


		const debug = this.runtimeContext.runtimeParams.verbose ? ' --debug' : '';
		await this.executeAsyncCommando(commando, `firebase${debug} deploy --only functions --force`, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to deploy function with exit code ${exitCode}`, stdout, stderr, exitCode);
		});

		this.logInfo(`Functions: `, this.functions);
	}

	//######################### ResolveConfig Logic #########################

	private getEnvConfig() {
		const envConfig = this.config.envConfig;
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig in unit ${this.config.key}`);

		return envConfig;
	}

	private async resolveFunctionsRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = {
			projects: {
				default: envConfig.projectId
			},
			targets: {
				[envConfig.projectId]: {
					database: {
						[envConfig.projectId]: [envConfig.projectId]
					}
				}
			}
		};
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseRC}`;
		await _fs.writeFile(targetPath, JSON.stringify(rcConfig, null, 2), {encoding: 'utf-8'});
	}

	private async resolveProxyFile() {
		const envConfig = this.getEnvConfig();
		const targetPath = this.pathToProxy();
		const path = this.runtimeContext.baiConfig.files?.backend?.proxy;
		if (!path)
			return;

		const params = {
			PROJECT_ID: `${envConfig.projectId}`,
			PROXY_PORT: `${this.config.basePort}`,
			SERVER_PORT: `${this.config.basePort + 1}`,
			PATH_TO_SSL_KEY: `${this.config.sslKey}`,
			PATH_TO_SSL_CERTIFICATE: `${this.config.sslCert}`,
		};
		await FileSystemUtils.file.template.copy(path, targetPath, params);
	}

	private pathToProxy() {
		return resolve(this.config.fullPath, 'src/main/proxy.ts');
	}

	private async resolveConfigDir() {
		//Create the dir if it doesn't exist
		const pathToFirebaseConfigFolder = `${this.config.fullPath}/${this.config.pathToFirebaseConfig}`;
		await FileSystemUtils.folder.create(pathToFirebaseConfigFolder);

		//Fill config dir with relevant files for each file that doesn't exist
		const defaultFiles = this.runtimeContext.baiConfig.files?.firebase;
		if (!defaultFiles) {
			this.logError('No defaultFileRoutes in project config');
			return;
		}

		await Promise.all(Const_FirebaseConfigKeys.map(async firebaseConfigKey => {
				const pathToConfigFile = `${pathToFirebaseConfigFolder}/${Const_FirebaseDefaultsKeyToFile[firebaseConfigKey]}`;
				if (!defaultFiles[firebaseConfigKey])
					return;

				const path = resolve(this.runtimeContext.parentUnit.config.fullPath, defaultFiles[firebaseConfigKey]);
				await FileSystemUtils.file.copy(path, pathToConfigFile);
			})
		);
	}

	private async resolveFunctionsJSON() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseJSON}`;
		let fileContent;
		if (envConfig.isLocal) {
			const port = this.config.basePort;
			fileContent = {
				database: [{
					target: this.config.envConfig.projectId,
					rules: `${this.config.pathToFirebaseConfig}/database.rules.json`
				}],
				firestore: {
					rules: `${this.config.pathToFirebaseConfig}/firestore.rules`,
					indexes: `${this.config.pathToFirebaseConfig}/firestore.indexes.json`
				},
				storage: {
					rules: `${this.config.pathToFirebaseConfig}/storage.rules`
				},
				remoteconfig: {
					template: `${this.config.pathToFirebaseConfig}/remoteconfig.template.json`
				},
				functions: {
					ignore: this.config.ignore,
					source: '.',
					predeploy: [
						'echo "Thunderstorm - Local environment is not deployable... Aborting..." && exit 2'
					]
				},
				emulators: {
					singleProjectMode: true,
					functions: {port: port + 1},
					database: {port: port + 2},
					firestore: {
						port: port + 3,
						websocketPort: port + 4
					},
					pubsub: {port: port + 5},
					storage: {port: port + 6},
					auth: {port: port + 7},
					ui: {port: port + 8, enabled: true},
					hub: {port: port + 9},
					logging: {port: port + 10}
				}
			};
		} else {
			fileContent = {
				functions: {
					source: this.config.output.replace(`${this.config.fullPath}/`, ''),
					ignore: this.config.ignore,
					runtime: 'nodejs22',
				}
			};
		}

		await _fs.writeFile(targetPath, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
	}

	private async resolveFunctionsRuntimeConfig() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.config.fullPath}/src/main/config.ts`;
		const envKey = this.runtimeContext.runtimeParams.environment;
		const beConfig = {
			envKey,
			pathToDefaultConfig: envConfig.defaultConfig ?? `/_config/default`,
			pathToEnvOverrideConfig: envConfig.defaultConfig ?? `/_config/${envKey}`,
		};

		const inLocalIgnoreTLS = `${envConfig.isLocal ? '// @ts-ignore\nprocess.env[\'NODE_TLS_REJECT_UNAUTHORIZED\'] = 0;\n\n' : ''}`;
		const fileContent = `${inLocalIgnoreTLS}export const Environment = ${JSON.stringify(beConfig)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Compile Logic #########################

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//copyAssetsToOutput will move the file to output
		// const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		// const appVersion = MemKey_ProjectConfig.get().projectVersion;
		// const fileContent = JSON.stringify({version: appVersion}, null, 2);
		// await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	protected deriveDistDependencies() {
		return this.dependencyUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = `file:.dependencies/${unit.config.key}`;
			return dependencies;
		}, super.deriveDistDependencies());
	}

	private async createDependenciesDir() {
		//Gather units that are dependencies of this unit
		await Promise.all(this.dependencyUnits.map(async unit => {
			//Copy dependency unit output into this units output/.dependency dir
			const dependencyOutputPath = `${unit.config.output}/`;
			const targetPath = `${this.config.output}/.dependencies/${unit.config.key}/`;
			await FileSystemUtils.folder.create(targetPath);

			await this.allocateCommando()
				.append(`rsync -a --delete ${dependencyOutputPath} ${targetPath}`)
				.execute();
		}));
	}

	//######################### Launch Logic #########################

	private async runProxy() {
		await this.resolveProxyFile();

		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath);

		const command = `${this.runtimeContext.parentUnit.config.fullPath}/${CONST_NodeModules}/.bin/tsx`;
		await this.executeAsyncCommando(commando, `${command} src/main/proxy.ts`);
		this.logWarning('PROXY TERMINATED');
	}

	private async runEmulator() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, type) => {
				if (this.emulatorLogStrings.error.some(errStr => log.includes(errStr)))
					return LogLevel.Error;

				if (this.emulatorLogStrings.warning.some(warnStr => log.includes(warnStr)))
					return LogLevel.Warning;
			})
			.onLog(/.*Emulator Hub running.*/, () => this.setStatus('Launch Complete'));

		await this.executeAsyncCommando(commando, `firebase emulators:start --project ${this.config.envConfig.projectId} --export-on-exit --import=${this.config.pathToEmulatorData} ${this.runtimeContext.runtimeParams.debugBackend
			? `--inspect-functions ${this.config.debugPort}` : ''}`);
		this.logWarning('EMULATORS TERMINATED');
	}

}

