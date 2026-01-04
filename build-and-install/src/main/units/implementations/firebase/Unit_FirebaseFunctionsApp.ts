import {UnitPhaseImplementor} from '../../../core/types.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC, CONST_PackageJSON, CONST_VersionApp} from '../../../config/consts.js';
import {FirebasePackageConfig} from '../../../config/types/index.js';
import {__stringify, _keys, _logger_logPrefixes, deepClone, ImplementationMissingException, LogLevel, Second, sleep, StringMap} from '@nu-art/ts-common';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, FunctionBuildTemplateFiles} from '../../../templates/consts.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Phase_BuildPushImage, Phase_Deploy, Phase_DeployImage, Phase_Launch} from '../../../phases/definitions/index.js';
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
	containerDeployment?: {
		artifactRegistry: {
			region: string;        // e.g., 'us-central1'
			repository: string;     // e.g., 'firebase-functions'
			projectId: string;     // GCP project ID
		};
		imageName: string;         // Required: Docker image name (must be lowercase, alphanumeric with dots, underscores, or hyphens)
		dockerfile?: string;      // Path to Dockerfile, defaults to './Dockerfile'
	};
};

// const CONST_VersionApp = 'version-app.json';


/**
 * Firebase Functions application unit.
 *
 * **Key Features**:
 * - Extends Unit_TypescriptLib (compiles TypeScript)
 * - Manages Firebase Functions configuration
 * - Supports emulator with SSL and debug ports
 * - Handles function deployment
 *
 * **Phases Implemented**:
 * - `prepare()`: Sets up Firebase Functions config
 * - `compile()`: Compiles TypeScript for functions
 * - `launch()`: Starts Firebase Functions emulator
 * - `deploy()`: Deploys functions to Firebase
 *
 * **Configuration**:
 * - `debugPort`: Port for Node.js debugger
 * - `basePort`: Base port for emulator
 * - `sslKey`/`sslCert`: SSL certificates for emulator
 * - `pathToEmulatorData`: Path for emulator data persistence
 * - `envConfig`: Environment config (projectId, identityAccount)
 *
 * **Emulator**: Runs Firebase Functions emulator with log filtering and error detection.
 */
export class Unit_FirebaseFunctionsApp<C extends Unit_FirebaseFunctionsApp_Config = Unit_FirebaseFunctionsApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_Deploy, Phase_BuildPushImage, Phase_DeployImage]> {

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

		const dependencies = packageJson.dependencies ?? {};

		// First, update existing dependencies (replace workspace:* with file: paths where applicable)
		_keys(dependencies).reduce((dependencies, packageName) => {
			if (distDependencies[packageName])
				dependencies[packageName] = distDependencies[packageName];
			return dependencies;
		}, dependencies);

		// Then, add ALL dependencyUnits to the dependencies (this includes transitive dependencies)
		// This ensures the entire dependency tree is referenced in the main package.json
		this.dependencyUnits.reduce((dependencies, unit) => {
			dependencies[unit.config.key] = distDependencies[unit.config.key];
			return dependencies;
		}, dependencies);

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

	async compile() {
		await this.createAppVersionFile();
		await super.compile();
	}

	async postCompile() {
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
		await this.executeAsyncCommando(commando, `${this.npmCommand('firebase')}${debug} deploy --only functions --force`, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to deploy function with exit code ${exitCode}`, stdout, stderr, exitCode);
		});

		this.logInfo(`Functions: `, this.functions);
	}

	/**
	 * Builds Docker container image using Google Cloud Build and pushes it to Artifact Registry.
	 *
	 * **Process**:
	 * 1. Validates image tag is provided via CLI
	 * 2. Validates containerDeployment config exists
	 * 3. Constructs Artifact Registry image reference
	 * 4. Ensures Dockerfile exists (creates default if missing)
	 * 5. Builds and pushes image using Google Cloud Build (no local Docker required)
	 *
	 * **Requirements**:
	 * - `--build-push-image <tag>` CLI flag with tag value
	 * - `containerDeployment` config in unit config
	 * - gcloud CLI installed and authenticated
	 * - Cloud Build API enabled in GCP project
	 * - No local Docker daemon required - Cloud Build handles everything
	 */
	async buildPushImage() {
		const containerDeployment = this.config.containerDeployment;
		if (!containerDeployment)
			throw new ImplementationMissingException(`Missing containerDeployment config in unit ${this.config.key}`);

		const imageTag = this.runtimeContext.runtimeParams.buildPushImage;
		// Tag is validated by CLI param processor

		const artifactRegistry = containerDeployment.artifactRegistry;
		const imageName = containerDeployment.imageName;

		const artifactRegistryPath = `${artifactRegistry.region}-docker.pkg.dev/${artifactRegistry.projectId}/${artifactRegistry.repository}`;
		const imageReference = `${artifactRegistryPath}/${imageName}:${imageTag}`;

		this.logInfo(`Building and pushing container image using Cloud Build: ${imageReference}`);

		// Generate Dockerfile in the output folder (never pollute workspace)
		// Cloud Build uploads the directory, so we'll reference it from output folder
		const buildOutputFolder = resolve(this.config.fullPath, '.trash/build-image');
		await FileSystemUtils.folder.delete(buildOutputFolder);
		await FileSystemUtils.folder.create(buildOutputFolder);
		const dockerfilePath = resolve(buildOutputFolder, containerDeployment.dockerfile || 'dockerfile');

		await FileSystemUtils.file.template.copy(FunctionBuildTemplateFiles.dockerfile, dockerfilePath, {});
		this.logInfo(`Created Dockerfile from template at ${dockerfilePath}`);

		const commando = this.allocateCommando()
			.cd(this.config.fullPath);

		// Calculate relative Dockerfile path from build context (current directory)
		// Cloud Build expects relative path from the build context root (this.config.fullPath)
		const dockerfileName = containerDeployment.dockerfile || 'dockerfile';
		const dockerfileRelativePath = `.trash/build-image/${dockerfileName}`;


		const cloudbuildYamlPath = resolve(buildOutputFolder, '.cloudbuild.yaml');

		// Load template and apply parameters
		const cloudbuildTemplateParams: StringMap = {
			IMAGE_REFERENCE: imageReference,
			DOCKERFILE_PATH: dockerfileRelativePath,
		};
		await FileSystemUtils.file.template.copy(FunctionBuildTemplateFiles.cloudbuildYaml, cloudbuildYamlPath, cloudbuildTemplateParams);

		// Cloud Build config path must also be relative to build context
		const cloudbuildYamlRelativePath = `.trash/build-image/.cloudbuild.yaml`;
		await this.executeAsyncCommando(commando, `gcloud builds submit --config ${cloudbuildYamlRelativePath} --project ${artifactRegistry.projectId} .`, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to build and push Docker image with Cloud Build (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Successfully built and pushed image: ${imageReference}`);
	}

	/**
	 * Deploys container image from Artifact Registry to Firebase Functions.
	 *
	 * **Process**:
	 * 1. Validates image tag is provided via CLI
	 * 2. Validates containerDeployment config exists
	 * 3. Reconstructs image reference (same logic as buildPushImage)
	 * 4. Updates firebase.json to use container image format
	 * 5. Deploys using Firebase CLI
	 * 6. Parses deployment output for function URLs
	 *
	 * **Requirements**:
	 * - `--deploy-image <tag>` CLI flag with tag value
	 * - `containerDeployment` config in unit config
	 * - Image must already exist in Artifact Registry (built via buildPushImage)
	 * - Firebase CLI installed and authenticated
	 */
	async deployImage() {
		const imageTag = this.runtimeContext.runtimeParams.deployImage;
		// Tag is validated by CLI param processor

		const containerDeployment = this.config.containerDeployment;
		if (!containerDeployment) {
			throw new ImplementationMissingException(`Missing containerDeployment config in unit ${this.config.key}`);
		}

		const artifactRegistry = containerDeployment.artifactRegistry;
		const imageName = containerDeployment.imageName;

		const artifactRegistryPath = `${artifactRegistry.region}-docker.pkg.dev/${artifactRegistry.projectId}/${artifactRegistry.repository}`;
		const imageReference = `${artifactRegistryPath}/${imageName}:${imageTag}`;

		this.logInfo(`Deploying container image: ${imageReference}`);

		// Update firebase.json to use container image
		// This will be done in resolveFunctionsJSON when deployImage tag is present
		await this.resolveConfigs();

		// Deploy using Firebase CLI
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter)
			// example: Function URL (hello(us-central1)): https://hello-kv65k7yylq-uc.a.run.app
			.onLog(/.*Function URL.*?\((.*?)\(.*(https:\/\/.*?)$/, match => {
				this.functions[match[1]] = match[2];
			});

		// For container deployment, use gcloud functions deploy with --image flag
		// Firebase CLI doesn't support deploying pre-built container images directly
		const functionName = 'hello'; // TODO: Extract from function exports or config
		const region = artifactRegistry.region;
		const gcloudDeployCommand = `gcloud functions deploy ${functionName} --gen2 --runtime=nodejs22 --region=${region} --source=${this.config.output.replace(`${this.config.fullPath}/`, '')} --entry-point=hello --trigger-http --allow-unauthenticated --image=${imageReference} --project=${artifactRegistry.projectId}`;

		// Check for dry run mode
		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would execute: ${gcloudDeployCommand}`);
			this.logInfo(`[DRY RUN] Would deploy image: ${imageReference}`);
			return;
		}

		await this.executeAsyncCommando(commando, gcloudDeployCommand, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to deploy function with exit code ${exitCode}`, stdout, stderr, exitCode);
		});

		this.logInfo(`Functions deployed: `, this.functions);
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
		const targetPath = resolve(this.config.fullPath, CONST_FirebaseRC);
		await FileSystemUtils.file.write.json(targetPath, rcConfig);
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

		// Check if container deployment is active
		const deployImageTag = this.runtimeContext.runtimeParams.deployImage;
		const isContainerDeployment = !!deployImageTag && !!this.config.containerDeployment;

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
		} else if (isContainerDeployment) {
			// Container-based deployment
			// For container deployment, source must still point to a directory (Firebase CLI requirement)
			// The container image is specified via environment variable or function code
			fileContent = {
				functions: {
					source: this.config.output.replace(`${this.config.fullPath}/`, ''),
					ignore: this.config.ignore,
				}
			};
		} else {
			// Source-based deployment (existing behavior)
			fileContent = {
				functions: {
					source: this.config.output.replace(`${this.config.fullPath}/`, ''),
					ignore: this.config.ignore,
					runtime: 'nodejs22',
				}
			};
		}

		await FileSystemUtils.file.write.json(targetPath, fileContent);
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
		await FileSystemUtils.file.write(targetPath, fileContent);
	}

	//######################### Compile Logic #########################

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//copyAssetsToOutput will move the file to output
		const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		const appVersion = this.runtimeContext.version;
		await FileSystemUtils.file.write.json(targetPath, {version: appVersion});
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

		await this.executeAsyncCommando(commando, `${this.npmCommand('tsx')} src/main/proxy.ts`);
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

		await this.executeAsyncCommando(commando, `${this.npmCommand('firebase')} emulators:start --project ${this.config.envConfig.projectId} --export-on-exit --import=${this.config.pathToEmulatorData} ${this.runtimeContext.runtimeParams.debugBackend
			? `--inspect-functions ${this.config.debugPort}` : ''}`);
		this.logWarning('EMULATORS TERMINATED');
	}

}

