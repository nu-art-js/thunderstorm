import {Unit_TypescriptLib} from '../core';
import {UnitPhaseImplementor} from '../types';
import {Phase_ResolveConfigs} from '../../phase';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON} from '../../../core/consts';
import {promises as _fs} from 'fs';
import {RuntimeParams} from '../../../core/params/params';
import {FirebasePackageConfig, PackageJson} from '../../../core/types';
import {_keys, deepClone, ImplementationMissingException} from '@nu-art/ts-common';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, MemKey_DefaultFiles} from '../../../defaults/consts';
import {MemKey_ProjectConfig} from '../../phase-runner/RunnerParams';
import {NVM} from '@nu-art/commando/cli/nvm';

type _Config<Config> = {
	firebaseConfig: FirebasePackageConfig;
	sources?: string[];
} & Config

const CONST_VersionApp = 'version-app.json';

export class Unit_FirebaseFunctionsApp<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_ResolveConfigs]> {

	//######################### Internal Logic #########################

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
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/${CONST_FirebaseRC}`);
		await _fs.writeFile(targetPath, JSON.stringify(rcConfig, null, 2), {encoding: 'utf-8'});
	}

	private async resolveProxyFile() {
		const envConfig = this.getEnvConfig();
		const defaultFiles = MemKey_DefaultFiles.get();
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/src/main/proxy.ts`);
		let fileContent = await _fs.readFile(defaultFiles.backend.proxy, {encoding: 'utf-8'});
		fileContent = fileContent.replace(/PROJECT_ID/g, `${envConfig.projectId}`);
		fileContent = fileContent.replace(/PROXY_PORT/g, `${this.config.firebaseConfig.basePort}`);
		fileContent = fileContent.replace(/SERVER_PORT/g, `${this.config.firebaseConfig.basePort + 1}`);
		fileContent = fileContent.replace(/PATH_TO_SSL_KEY/g, `${this.config.firebaseConfig.ssl?.pathToKey}`);
		fileContent = fileContent.replace(/PATH_TO_SSL_CERTIFICATE/g, `${this.config.firebaseConfig.ssl?.pathToCertificate}`);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	private async resolveConfigDir() {
		//Create the dir if it doesn't exist
		const pathToFirebaseConfigFolder = `${this.config.pathToPackage}/${this.config.firebaseConfig.pathToFirebaseConfig}`;
		try {
			await _fs.access(pathToFirebaseConfigFolder);
		} catch (e: any) {
			await _fs.mkdir(pathToFirebaseConfigFolder, {recursive: true});
		}

		//Fill config dir with relevant files for each file that doesn't exist
		const defaultFiles = MemKey_DefaultFiles.get();
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
	}

	private async resolveFunctionsJSON() {
		const envConfig = this.getEnvConfig();
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/${CONST_FirebaseJSON}`);
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
		const targetPath = convertToFullPath(`${this.config.pathToPackage}/src/main/config.ts`);
		const beConfig = {name: envConfig.env};
		const fileContent = `${envConfig.isLocal ? '// @ts-ignore\nprocess.env[\'NODE_TLS_REJECT_UNAUTHORIZED\'] = 0;\n' : ''}
		export const Environment = ${JSON.stringify(beConfig)};`;
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//copyAssetsToOutput will move the file to output
		const targetPath = `${this.runtime.path.pkg}/${CONST_VersionApp}`;
		const appVersion = MemKey_ProjectConfig.get().projectVersion;
		const fileContent = JSON.stringify({version: appVersion}, null, 2);
		await _fs.writeFile(targetPath, fileContent, {encoding: 'utf-8'});
	}

	private async createDependenciesDir() {
		//Gather units that are dependencies of this unit
		const dependencies = _keys(this.packageJson.root.dependencies ?? {}) as string[];
		const tsLibUnits = MemKey_ProjectConfig.get().units.filter(unit => unit instanceof Unit_TypescriptLib) as Unit_TypescriptLib[];
		const dependencyUnits = tsLibUnits.filter(unit => {
			const unitPJName = unit.packageJson.root.name;
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
			const commando = NVM.createCommando();

			//Copy dependency unit output into this units output/.dependency dir
			const dependencyOutputPath = `${unit.runtime.path.output}/`;
			const targetPath = `${this.runtime.path.output}/.dependencies/${unit.config.key}/`;
			const pjTargetPath = `${targetPath}/${CONST_PackageJSON}`;

			await commando
				.append(`mkdir -p ${targetPath}`)
				.append(`rsync -a --delete ${dependencyOutputPath} ${targetPath}`)
				.execute();

			//Copy units dependency package into newly created dir
			const dependencyPJ = packageJsonConverter(unit.packageJson.dist)
			const fileContent = JSON.stringify(dependencyPJ, null, 2);
			await _fs.writeFile(pjTargetPath, fileContent, {encoding: 'utf-8'});
		}));

		this.packageJson.dist = packageJsonConverter(this.packageJson.dist)
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
	}
}