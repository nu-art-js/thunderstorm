import {BaseUnit, Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../core';
import {UnitPhaseImplementor} from '../types';
import {Phase_DeployBackend, Phase_Launch, Phase_ResolveConfigs} from '../../phase';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON} from '../../../core/consts';
import {promises as _fs} from 'fs';
import {RuntimeParams} from '../../../core/params/params';
import {FirebasePackageConfig, PackageJson} from '../../../core/types';
import {_keys, deepClone, ImplementationMissingException, Second, sleep} from '@nu-art/ts-common';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, MemKey_DefaultFiles} from '../../../defaults/consts';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {MemKey_PhaseRunner} from '../../phase-runner/consts';
import {dispatcher_UnitWatchCompile, dispatcher_WatchEvent, OnUnitWatchCompiled} from '../runner-dispatchers';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';


export type Unit_FirebaseFunctionsApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig: FirebasePackageConfig;
	sources?: string[];
};

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseFunctionsApp<C extends Unit_FirebaseFunctionsApp_Config = Unit_FirebaseFunctionsApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs, Phase_Launch, Phase_DeployBackend]>, OnUnitWatchCompiled {

	static staggerCount: number = 0;

	async __onUnitWatchCompiled(unit: BaseUnit) {
		if (this.runtime.unitDependencyNames.includes(unit.runtime.dependencyName)) {
			this.setStatus('Compiling', 'start');
			try {
				await this.compileImpl();
				await this.copyAssetsToOutput();
				await this.createDependenciesDir();
				this.setStatus('Compiled', 'end');
			} catch (e: any) {
				this.setErrorStatus('Compilation Error', e);
				this.logError(e);
				// throw e;
			}
		}
	}

	constructor(config: Unit_FirebaseFunctionsApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseFunctionsApp);
	}

	protected async init(setInitialized: boolean = true): Promise<void> {
		await super.init(false);

		// only sign on listeners when the unit is being initialized
		dispatcher_WatchEvent.removeListener(this);
		dispatcher_UnitWatchCompile.addListener(this);

		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Phase Implementations #########################

	async resolveConfigs() {
		await this.resolveFunctionsRC();
		await this.resolveConfigDir();
		await this.resolveFunctionsRuntimeConfig();
		await this.resolveFunctionsJSON();
	}

	async compile() {
		this.setStatus('Compiling', 'start');
		try {
			await this.resolveTSConfig();
			await this.clearOutputDir();
			await this.createAppVersionFile();
			await this.compileImpl();
			await this.copyAssetsToOutput();
			await this.createDependenciesDir();
			await this.copyPackageJSONToOutput();
			this.setStatus('Compiled', 'end');
		} catch (e: any) {
			this.setErrorStatus('Compilation Error', e);
			throw e;
		}
	}

	async launch() {
		this.setStatus('Launching');
		await sleep(2 * Second * Unit_FirebaseFunctionsApp.staggerCount++);
		await this.releasePorts();
		await Promise.all([
			this.runProxy(),
			this.runEmulator(),
		]);
	}

	async deployBackend() {
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
			const finalPJ = deepClone(pj);
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

			await this.allocateCommando()
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

	private async releasePorts() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM();
		const allPorts = Array.from({length: 10}, (_, i) => `${this.config.firebaseConfig.basePort + i}`);

		await commando.setUID(this.config.key)
			.append(`array=($(lsof -ti:${allPorts.join(',')}))`)
			.append(`((\${#array[@]} > 0)) && kill -9 "\${array[@]}"`)
			.append('echo ')
			.execute();
	}

	private async runProxy() {
		await this.resolveProxyFile();

		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.runtime.pathTo.pkg)
			.append('ts-node src/main/proxy.ts');

		await this.executeAsyncCommando(commando);
		this.logWarning('PROXY TERMINATED');
	}

	private async runEmulator() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.runtime.pathTo.pkg)
			.onLog(/.*Emulator Hub running.*/, () => this.setStatus('Launch Complete'))
			.append(`firebase emulators:start --export-on-exit --import=.trash/data ${RuntimeParams.debugBackend ? `--inspect-functions ${this.config.firebaseConfig.debugPort}` : ''}`);

		await this.executeAsyncCommando(commando);
		this.logWarning('EMULATORS TERMINATED');
	}

	//######################### Deploy Logic #########################

	private async deployImpl() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.runtime.pathTo.output)
			.ls()
			.cat('package.json')
			.cat('index.js')
			.cd(this.runtime.pathTo.pkg)
			.append(`firebase --debug deploy --only functions --force`);

		return this.executeAsyncCommando(commando);
	}
}

