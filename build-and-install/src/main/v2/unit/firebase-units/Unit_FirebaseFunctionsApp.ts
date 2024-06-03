import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../core';
import {UnitPhaseImplementor} from '../types';
import {Phase_DeployBackend, Phase_Launch, Phase_ResolveConfigs} from '../../phase';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON} from '../../../core/consts';
import {promises as _fs} from 'fs';
import {RuntimeParams} from '../../../core/params/params';
import {FirebasePackageConfig, PackageJson} from '../../../core/types';
import {_keys, deepClone, ImplementationMissingException, Second, sleep} from '@nu-art/ts-common';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, MemKey_DefaultFiles} from '../../../defaults/consts';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {Cli_Basic} from '@nu-art/commando/cli/basic';
import {NVM} from '@nu-art/commando/cli/nvm';
import {Commando, CommandoInteractive} from '@nu-art/commando/shell';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';


export type Unit_FirebaseFunctionsApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig: FirebasePackageConfig;
	sources?: string[];
};

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseFunctionsApp<C extends Unit_FirebaseFunctionsApp_Config = Unit_FirebaseFunctionsApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs, Phase_Launch, Phase_DeployBackend]> {

	static staggerCount: number = 0;

	private emulatorPid?: number;
	private proxyPid?: number;

	private launchCommandos!: {
		emulator: CommandoInteractive & Cli_Basic;
		proxy: CommandoInteractive & Cli_Basic
	};

	constructor(config: Unit_FirebaseFunctionsApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseFunctionsApp);
	}

	//######################### Phase Implementations #########################

	async resolveConfigs() {
		await this.resolveFunctionsRC();
		await this.resolveProxyFile();
		await this.resolveConfigDir();
		await this.resolveFunctionsRuntimeConfig();
		await this.resolveFunctionsJSON();
	}

	async compile() {
		this.setStatus('Compile');
		await this.resolveTSConfig();
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
		await this.copyAssetsToOutput();
		await this.createDependenciesDir();
		await this.copyPackageJSONToOutput();
		this.setStatus('Compiled');
	}

	async launch() {
		this.setStatus('Launching');
		await sleep(2 * Second * Unit_FirebaseFunctionsApp.staggerCount++);
		await this.initLaunch();
		await this.initLaunchListeners();
		await this.clearPorts();
		await Promise.all([
			this.runProxy(),
			this.runEmulator(),
		]);
	}

	async deployBackend() {
		await this.printFiles();
		await this.deployImpl();
	}

	//######################### ResolveConfig Logic #########################

	private getEnvConfig() {
		const env = RuntimeParams.environment;
		const envConfig = this.config.firebaseConfig.envs.find(_env => _env.env === env);
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig for env ${env} in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveFunctionsRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = {projects: {default: envConfig.projectId}};
		const targetPath = `${this.runtime.pathTo.pkg}/${CONST_FirebaseRC}`;
		await _fs.writeFile(targetPath, JSON.stringify(rcConfig, null, 2), {encoding: 'utf-8'});
	}

	private async resolveProxyFile() {
		const envConfig = this.getEnvConfig();
		const defaultFiles = MemKey_DefaultFiles.get();
		const targetPath = `${this.runtime.pathTo.pkg}/src/main/proxy.ts`;
		const path = defaultFiles?.backend?.proxy;
		if (!path)
			return;

		let fileContent = await _fs.readFile(path, {encoding: 'utf-8'});
		fileContent = fileContent.replace(/PROJECT_ID/g, `${envConfig.projectId}`);
		fileContent = fileContent.replace(/PROXY_PORT/g, `${this.config.firebaseConfig.basePort}`);
		fileContent = fileContent.replace(/SERVER_PORT/g, `${this.config.firebaseConfig.basePort + 1}`);
		fileContent = fileContent.replace(/PATH_TO_SSL_KEY/g, `${this.config.firebaseConfig.ssl?.pathToKey}`);
		fileContent = fileContent.replace(/PATH_TO_SSL_CERTIFICATE/g, `${this.config.firebaseConfig.ssl?.pathToCertificate}`);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	private async resolveConfigDir() {
		//Create the dir if it doesn't exist
		const pathToFirebaseConfigFolder = `${this.runtime.pathTo.pkg}/${this.config.firebaseConfig.pathToFirebaseConfig}`;
		try {
			await _fs.access(pathToFirebaseConfigFolder);
		} catch (e: any) {
			await _fs.mkdir(pathToFirebaseConfigFolder, {recursive: true});
		}

		//Fill config dir with relevant files for each file that doesn't exist
		const defaultFiles = MemKey_ProjectConfig.get().defaultFileRoutes;
		if (!defaultFiles) {
			this.logError('No defaultFileRoutes in project config');
			return;
		}

		await Promise.all(Const_FirebaseConfigKeys.map(async firebaseConfigKey => {
				const pathToConfigFile = `${pathToFirebaseConfigFolder}/${Const_FirebaseDefaultsKeyToFile[firebaseConfigKey]}`;
				try {
					await _fs.access(pathToConfigFile);
				} catch (e: any) {
					const path = defaultFiles.firebaseConfig?.[firebaseConfigKey];
					if (!path)
						return;

					const defaultFileContent = await _fs.readFile(path, {encoding: 'utf-8'});
					await _fs.writeFile(pathToConfigFile, defaultFileContent, {encoding: 'utf-8'});
				}
			})
		);
	}

	private async resolveFunctionsJSON() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.runtime.pathTo.pkg}/${CONST_FirebaseJSON}`;
		let fileContent;
		if (envConfig.isLocal) {
			const port = this.config.firebaseConfig.basePort;
			fileContent = {
				database: {
					rules: `${this.config.firebaseConfig.pathToFirebaseConfig}/database.rules.json`
				},
				firestore: {
					rules: `${this.config.firebaseConfig.pathToFirebaseConfig}/firestore.rules`,
					indexes: `${this.config.firebaseConfig.pathToFirebaseConfig}/firestore.indexes.json`
				},
				storage: {
					rules: `${this.config.firebaseConfig.pathToFirebaseConfig}/storage.rules`
				},
				remoteconfig: {
					template: `${this.config.firebaseConfig.pathToFirebaseConfig}/remoteconfig.template.json`
				},
				functions: {
					ignore: this.config.firebaseConfig.functions?.ignore,
					source: '.',
					predeploy: [
						'echo "Thunderstorm - Local environment is not deployable... Aborting..." && exit 2'
					]
				},
				emulators: {
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
					source: this.config.output.replace(`${this.config.pathToPackage}/`, ''),
					ignore: this.config.firebaseConfig.functions?.ignore
				}
			};
		}

		await _fs.writeFile(targetPath, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
	}

	private async resolveFunctionsRuntimeConfig() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.runtime.pathTo.pkg}/src/main/config.ts`;
		const beConfig = {name: envConfig.env};
		const fileContent = `${envConfig.isLocal ? '// @ts-ignore\nprocess.env[\'NODE_TLS_REJECT_UNAUTHORIZED\'] = 0;\n' : ''}
		export const Environment = ${JSON.stringify(beConfig)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	//######################### Compile Logic #########################

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//copyAssetsToOutput will move the file to output
		const targetPath = `${this.runtime.pathTo.pkg}/src/main/${CONST_VersionApp}`;
		const appVersion = MemKey_ProjectConfig.get().projectVersion;
		const fileContent = JSON.stringify({version: appVersion}, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	private async createDependenciesDir() {
		//Gather units that are dependencies of this unit
		const dependencies = _keys(this.packageJson.root.dependencies ?? {}) as string[];
		const runner = MemKey_PhaseRunner.get();
		const tsLibUnits = runner.getUnits().filter(unit => unit instanceof Unit_TypescriptLib) as Unit_TypescriptLib[];
		const dependencyUnits = tsLibUnits.filter(unit => {
			const unitPJName = unit.packageJson.template.name;
			return dependencies.includes(unitPJName);
		});

		if (!dependencyUnits.length)
			return;

		const packageJsonConverter = (pj: PackageJson): PackageJson => {
			const finalPJ = deepClone(this.packageJson.dist);
			finalPJ.dependencies ??= {};
			_keys(finalPJ.dependencies).reduce((acc, packageName) => {
				const unit = dependencyUnits.find(unit => unit.packageJson.template.name === packageName);
				if (!unit)
					return acc;

				acc[packageName] = `file:.dependencies/${unit.config.key}`;
				return acc;
			}, finalPJ.dependencies);

			return finalPJ;
		};

		await Promise.all(dependencyUnits.map(async unit => {

			//Copy dependency unit output into this units output/.dependency dir
			const dependencyOutputPath = `${unit.runtime.pathTo.output}/`;
			const targetPath = `${this.runtime.pathTo.output}/.dependencies/${unit.config.key}/`;
			const pjTargetPath = `${targetPath}/${CONST_PackageJSON}`;

			await Commando.create()
				.append(`mkdir -p ${targetPath}`)
				.append(`rsync -a --delete ${dependencyOutputPath} ${targetPath}`)
				.execute();

			//Copy units dependency package into newly created dir
			const dependencyPJ = packageJsonConverter(unit.packageJson.dist);
			const fileContent = JSON.stringify(dependencyPJ, null, 2);
			await _fs.writeFile(pjTargetPath, fileContent, {encoding: 'utf-8'});
		}));

		this.packageJson.dist = packageJsonConverter(this.packageJson.dist);
	}

	//######################### Launch Logic #########################

	private async clearPorts() {
		const allPorts = Array.from({length: 10}, (_, i) => `${this.config.firebaseConfig.basePort + i}`);
		await Commando.create(Cli_Basic)
			.append(`array=($(lsof -ti:${allPorts.join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	private onLaunched() {
		this.setStatus('Launch Complete');
	}

	private async initLaunch() {
		this.launchCommandos = {
			emulator: NVM.createInteractiveCommando(Cli_Basic).setUID(this.config.key).cd(this.runtime.pathTo.pkg),
			proxy: NVM.createInteractiveCommando(Cli_Basic).setUID(this.config.key).cd(this.runtime.pathTo.pkg),
		};
	}

	private async initLaunchListeners() {
		this.launchCommandos.emulator.awaitForLog(/.*Emulator Hub running.*/, () => this.onLaunched());
	}

	private async runProxy() {
		await this.launchCommandos.proxy
			.append('ts-node src/main/proxy.ts')
			.executeAsync(pid => this.proxyPid = pid);

		await this.launchCommandos.proxy.gracefullyKill(this.proxyPid);
	}

	private async runEmulator() {
		await this.launchCommandos.emulator
			.append(`firebase emulators:start --export-on-exit --import=.trash/data ${RuntimeParams.debugBackend ? `--inspect-functions ${this.config.firebaseConfig.debugPort}` : ''}`)
			.executeAsync(pid => this.emulatorPid = pid);

		await this.launchCommandos.emulator.gracefullyKill(this.emulatorPid);
	}

	public async kill() {
		if (!this.launchCommandos)
			return;

		this.logWarning(`Killing unit - ${this.config.label}`);
		await this.launchCommandos.emulator.gracefullyKill(this.emulatorPid);
		await this.launchCommandos.proxy.gracefullyKill(this.proxyPid);
		this.logWarning(`Unit killed - ${this.config.label}`);
	}

	//######################### Deploy Logic #########################

	private async printFiles() {
		await Commando.create(Cli_Basic)
			.cd(this.runtime.pathTo.output)
			.ls()
			.cat('package.json')
			.cat('index.js')
			.execute();
	}

	private async deployImpl() {
		await NVM.createCommando(Cli_Basic)
			.cd(this.runtime.pathTo.pkg)
			.append(`firebase --debug deploy --only functions --force`)
			.execute();
	}
}

// export class CommandoCLIListener {
//
// 	private cb: CommandoCLIListener_Callback;
// 	protected filter?: RegExp;
//
// 	constructor(callback: CommandoCLIListener_Callback, filter?: string | RegExp) {
// 		this.cb = callback;
// 		if (!filter)
// 			return;
//
// 		if (typeof filter === 'string')
// 			this.filter = new RegExp(filter);
// 		else
// 			this.filter = filter as RegExp;
// 	}
//
// 	//######################### Inner Logic #########################
//
// 	private _process(stdout: string) {
// 		if (!this.stdoutPassesFilter(stdout))
// 			return false;
//
// 		this.process(stdout);
// 		return true;
// 	}
//
// 	private stdoutPassesFilter = (stdout: string): boolean => {
// 		if (!this.filter)
// 			return true;
//
// 		return this.filter.test(stdout);
// 	};
//
// 	//######################### Functions #########################
//
// 	public listen = <T extends Commando | CommandoInteractive>(commando: T): T => {
// 		const process = this._process.bind(this);
// 		commando.addLogProcessor(process);
// 		return commando;
// 	};
//
// 	protected process(stdout: string) {
// 		this.cb(stdout);
// 	}
// }

