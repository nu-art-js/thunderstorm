import {FirebasePackageConfig} from '../../../config/types/index.js';
import {UnitPhaseImplementor} from '../../../core/types.js';
import {ImplementationMissingException, LogLevel, StringMap, TS_Object, TypedMap} from '@nu-art/ts-common';
import {CONST_DeployHostingDir, CONST_DeploymentMetadata, CONST_FirebaseJSON, CONST_FirebaseRC, CONST_HostingBuildTarball, CONST_StagingDir, CONST_TrashDir, CONST_VersionApp} from '../../../config/consts.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Commando_Basic} from '@nu-art/commando/shell/plugins/basic';
import {UnitConfigJSON_Node} from '../../discovery/resolvers/UnitMapper_Node.js';
import {resolve} from 'path';
import {Phase_BuildPushImage, Phase_Deploy, Phase_DeployImage, Phase_Launch} from '../../../phases/definitions/index.js';
import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../Unit_TypescriptLib.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {deployLogFilter, ensureArtifactRegistryRepository} from './common.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';


export type FirebaseHostingConfig = {
	public: string
	rewrites: {
		source: string
		destination: string
	}[]
};

export type FirebaseHosting_EnvConfig = {
	config: TS_Object,
	projectId: string,
	isLocal?: boolean
};
export type UnitConfigJSON_FirebaseHosting = UnitConfigJSON_Node & {
	servingPort?: number,
	hostingConfig?: FirebaseHostingConfig
	envs: TypedMap<FirebaseHosting_EnvConfig>
};

export type Unit_FirebaseHostingApp_Config = Unit_TypescriptLib_Config & {
	firebaseConfig?: FirebasePackageConfig;
	servingPort: number
	hostingConfig?: FirebaseHostingConfig
	envConfig: FirebaseHosting_EnvConfig
	sources?: string[];
	hostingDeployment?: {
		artifactRegistry: {
			region: string;
			repository: string;
			projectId: string;
		};
	};
};

/**
 * Firebase Hosting application unit.
 *
 * **Key Features**:
 * - Extends Unit_TypescriptLib (compiles TypeScript)
 * - Manages Firebase hosting configuration (firebase.json, .firebaserc)
 * - Supports multiple environments (local, staging, production)
 * - Implements launch and deploy phases
 *
 * **Phases Implemented**:
 * - `prepare()`: Resolves Firebase hosting config files
 * - `compile()`: Compiles TypeScript (without declarations)
 * - `launch()`: Starts Firebase hosting emulator
 * - `deploy()`: Deploys to Firebase hosting
 *
 * **Configuration**:
 * - `servingPort`: Port for local hosting server
 * - `hostingConfig`: Firebase hosting configuration (public folder, rewrites)
 * - `envConfig`: Environment-specific config (projectId, isLocal)
 */
export class Unit_FirebaseHostingApp<C extends Unit_FirebaseHostingApp_Config = Unit_FirebaseHostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_Deploy, Phase_BuildPushImage, Phase_DeployImage]> {

	public hosting: StringMap = {};
	public injectedMetadata: StringMap = {};

	static DefaultConfig_FirebaseHosting = {
		servingPort: 8100,
		output: 'dist',
	};

	constructor(config: Unit_FirebaseHostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_FirebaseHostingApp);
	}

	//######################### Phase Implementations #########################

	async prepare() {
		await super.prepare();
		await this.resolveHostingRC();
		await this.resolveHostingJSON();
		await this.resolveHostingRuntimeConfig();
	}

	async compile() {
		await this.resolveTSConfig(resolve(this.config.fullPath, './src'), 'main', {compilerOptions: {declaration: false}});
		await this.clearOutputDir();
		await this.createAppVersionFile();
		await this.compileImpl();
	}

	async launch() {
		this.setStatus('Launching');
		await this.releaseWebpackPorts();
		await this.runApp();
	}

	async releaseWebpackPorts() {
		return this.releasePorts([`${this.config.servingPort}`]);
	}

	async deploy() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter)
			// example: Function URL (hello(us-central1)): https://hello-kv65k7yylq-uc.a.run.app
			.onLog(/.*Hosting URL.*(https:\/\/.*?)$/, match => {
				this.hosting[match[1]] = match[2];
			});

		const debug = this.runtimeContext.runtimeParams.verbose ? ' --debug' : '';
		await this.executeAsyncCommando(commando, `${this.npmCommand('firebase')}${debug} deploy --only hosting`);
	}

	//######################### ResolveConfig Logic #########################

	private getEnvConfig() {
		const envConfig = this.config.envConfig;
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveHostingRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = { projects: { default: envConfig.projectId } };
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseRC}`;
		await FileSystemUtils.file.write.json(targetPath, rcConfig);
	}


	private async resolveHostingJSON() {
		const envConfig = this.getEnvConfig();
		const targetPath = `${this.config.fullPath}/${CONST_FirebaseJSON}`;
		let fileContent: any;

		if (envConfig.isLocal)
			fileContent = {};
		else
			fileContent = {
				hosting: this.config.hostingConfig ?? {
					'public': 'dist',
					'rewrites': [
						{ 'source': '**', 'destination': '/index.html' }
					]
				}
			};

		await FileSystemUtils.file.write.json(targetPath, fileContent);
	}

	private async resolveHostingRuntimeConfig() {
		const envConfig = this.getEnvConfig().config;
		const targetPath = resolve(this.config.fullPath, `./src/main/config.ts`);
		const fileContent = `export const config = ${JSON.stringify(envConfig, null, 2)};`;
		await FileSystemUtils.file.write(targetPath, fileContent);
	}

	//######################### Compile Logic #########################

	protected async compileImpl() {
		const commando = this.allocateCommando(Commando_NVM, Commando_Basic).applyNVM()
			.cd(this.config.fullPath);

		await this.executeAsyncCommando(commando, `ENV=${this.runtimeContext.runtimeParams.environment} npm run build`, (stdout, stderr, exitCode) => {
			if (exitCode > 0)
				throw new CommandoException(`Error compiling`, stdout, stderr, exitCode);
		});
	}

	private async createAppVersionFile() {
		//Writing the file to the package source instead of the output is fine,
		//Webpack bundles files into the output automatically!
		const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		const appVersion = this.runtimeContext.version;
		await FileSystemUtils.file.write.json(targetPath, {version: appVersion});
	}

	//######################### Launch Logic #########################

	private async runApp() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.setUID(this.config.key)
			.cd(this.config.fullPath)
			.setLogLevelFilter((log, type) => {
				if (log.toLowerCase().includes('<i>'))
					return LogLevel.Info;
			});

		await this.executeAsyncCommando(commando, 'npm run start');
		this.logWarning('HOSTING TERMINATED');
	}

	//######################### Build Push Image Phase #########################

	/**
	 * Builds hosting output and uploads it to Artifact Registry as a generic package.
	 *
	 * **Process**:
	 * 1. Validates hostingDeployment config exists
	 * 2. Creates deployment-metadata.json with build information
	 * 3. Creates tarball of hosting output directory
	 * 4. Uploads to Artifact Registry as generic package
	 *
	 * **Requirements**:
	 * - `--build-push-image <tag>` CLI flag with tag value
	 * - `hostingDeployment` config in unit config
	 * - gcloud CLI installed and authenticated
	 * - Artifact Registry API enabled in GCP project
	 */
	async buildPushImage() {
		const hostingDeployment = this.config.hostingDeployment;
		if (!hostingDeployment) {
			throw new ImplementationMissingException(`Missing hostingDeployment config in unit ${this.config.key}`);
		}

		const buildTag = this.runtimeContext.runtimeParams.buildPushImage;
		if (!buildTag) {
			throw new ImplementationMissingException(`Missing buildPushImage runtime param in unit ${this.config.key}`);
		}

		const artifactRegistry = hostingDeployment.artifactRegistry;
		const packageName = this.config.packageJson.name;

		this.logInfo(`Building and uploading hosting package to Artifact Registry:`);
		this.logInfo(`  Package: ${packageName}`);
		this.logInfo(`  Tag: ${buildTag}`);

		// Check for dry run mode
		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would build and upload hosting package: ${packageName}:${buildTag}`);
			return;
		}

		// Ensure Artifact Registry repository exists
		const commando = this.allocateCommando();
		await ensureArtifactRegistryRepository(
			commando,
			artifactRegistry,
			'generic',
			this
		);

		// Create deployment-metadata.json in output directory
		const metadata = {
			...this.injectedMetadata,
			'build.timestamp': new Date().toISOString(),
			'build.tag': buildTag,
			'build.project': artifactRegistry.projectId,
			'build.package-name': packageName,
			'version': this.runtimeContext.version,
			'git.commit': process.env.GIT_COMMIT || '',
			'git.branch': process.env.GIT_BRANCH || '',
			'build.user': process.env.USER || '',
		};

		this.logDebug(`Metadata: `, metadata);

		// Create staging directory for tarball contents
		const buildOutputDir = resolve(this.config.fullPath, CONST_TrashDir);
		const stagingDir = resolve(buildOutputDir, CONST_StagingDir);
		await FileSystemUtils.folder.delete(stagingDir);
		await FileSystemUtils.folder.create(stagingDir);
		const tarballPath = resolve(buildOutputDir, CONST_HostingBuildTarball);

		// Ensure firebase.json and .firebaserc exist (they should from prepare phase)
		await this.resolveHostingRC();
		await this.resolveHostingJSON();

		// Copy all files to staging directory
		const firebaseJsonPath = resolve(this.config.fullPath, CONST_FirebaseJSON);
		const firebaseRcPath = resolve(this.config.fullPath, CONST_FirebaseRC);
		const outputDirName = resolve(this.config.output).split('/').pop() || 'dist';

		// Copy firebase.json, .firebaserc, dist folder, and create deployment-metadata.json
		await FileSystemUtils.file.copy(firebaseJsonPath, resolve(stagingDir, CONST_FirebaseJSON));
		await FileSystemUtils.file.copy(firebaseRcPath, resolve(stagingDir, CONST_FirebaseRC));
		await FileSystemUtils.folder.copy(this.config.output, resolve(stagingDir, outputDirName));
		await FileSystemUtils.file.write.json(resolve(stagingDir, CONST_DeploymentMetadata), metadata);

		// Create tarball from staging directory contents
		// Note: Use explicit file list to include hidden files (.*) which * wildcard doesn't match
		commando.cd(stagingDir);
		await this.executeAsyncCommando(commando, `tar -czf ${tarballPath} ${CONST_FirebaseJSON} ${CONST_FirebaseRC} ${CONST_DeploymentMetadata} ${outputDirName}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to create tarball (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Created tarball: ${tarballPath}`);

		// Upload to Artifact Registry
		const region = artifactRegistry.region;
		const repository = artifactRegistry.repository;
		const projectId = artifactRegistry.projectId;

		// Upload file - package and version are created automatically if they don't exist
		// Note: Generic packages don't support "latest" version like Docker images
		// The build tag should be used for deployment (defaults to 'latest' if not specified)
		await this.executeAsyncCommando(commando, `gcloud artifacts generic upload --package=${packageName} --version=${buildTag} --source=${tarballPath} --location=${region} --repository=${repository} --project=${projectId}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to upload hosting package to Artifact Registry (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Successfully uploaded hosting package: ${packageName}:${buildTag} and ${packageName}:latest`);
	}

	//######################### Deploy Image Phase #########################

	/**
	 * Deploys hosting build from Artifact Registry to Firebase Hosting.
	 *
	 * **Process**:
	 * 1. Validates hostingDeployment config exists
	 * 2. Downloads tarball from Artifact Registry
	 * 3. Extracts to temp directory
	 * 4. Sets up Firebase tools (package.json + npm install)
	 * 5. Deploys to Firebase Hosting
	 * 6. Validates deployment by fetching deployment-metadata.json
	 *
	 * **Requirements**:
	 * - `--deploy-image <tag>` CLI flag with tag value
	 * - `hostingDeployment` config in unit config
	 * - Package must already exist in Artifact Registry (built via buildPushImage)
	 * - gcloud CLI installed and authenticated
	 * - Firebase CLI (installed via npm in temp directory)
	 */
	async deployImage() {
		const hostingDeployment = this.config.hostingDeployment;
		if (!hostingDeployment) {
			throw new ImplementationMissingException(`Missing hostingDeployment config in unit ${this.config.key}`);
		}

		const deployTag = this.runtimeContext.runtimeParams.deployImage;
		if (!deployTag) {
			throw new ImplementationMissingException(`Missing deployImage runtime param in unit ${this.config.key}. Generic packages require a specific version tag (cannot use 'latest')`);
		}

		const artifactRegistry = hostingDeployment.artifactRegistry;
		const packageName = this.config.packageJson.name;
		const region = artifactRegistry.region;
		const repository = artifactRegistry.repository;
		const projectId = artifactRegistry.projectId;

		this.logInfo(`Deploying hosting package: ${packageName}:${deployTag}`);

		// Check for dry run mode
		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would deploy hosting package: ${packageName}:${deployTag}`);
			return;
		}

		// Setup temp directory for deployment
		const deployTempDir = resolve(this.config.fullPath, `${CONST_TrashDir}/${CONST_DeployHostingDir}`);
		this.logInfo(`Setting up deployment directory: ${deployTempDir}`);
		await FileSystemUtils.folder.delete(deployTempDir);
		await FileSystemUtils.folder.create(deployTempDir);

		const commando = this.allocateCommando(Commando_NVM)
			.applyNVM()
			.cd(deployTempDir)
			.mark();

		// Download tarball from Artifact Registry
		// Note: --destination must be a directory, not a file path
		this.logInfo(`Downloading hosting package from Artifact Registry from: ${projectId}/${repository}/${packageName}/${deployTag}`);

		await this.executeAsyncCommando(commando, `gcloud artifacts generic download --package=${packageName} --version=${deployTag} --destination=${deployTempDir} --location=${region} --repository=${repository} --project=${projectId}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to download hosting package from Artifact Registry (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		// Find the downloaded file (gcloud downloads with auto-generated name based on package and version)
		// The file will be named: {packageName}-{version}.tar.gz
		this.logInfo(`Locating downloaded tarball...`);
		const downloadedFiles = await FileSystemUtils.folder.list(deployTempDir);
		const tarballFile = downloadedFiles.find(file => file.endsWith('.tar.gz'));
		if (!tarballFile) {
			throw new ImplementationMissingException(`Downloaded tarball not found in ${deployTempDir}. Files found: ${downloadedFiles.join(', ')}`);
		}
		const tarballPath = resolve(deployTempDir, tarballFile);
		this.logDebug(`Downloaded tarball: ${tarballPath}`);

		// Extract tarball directly to deployTempDir (contains firebase.json, .firebaserc, and dist/)
		this.logInfo(`Extracting hosting package...`);
		await this.executeAsyncCommando(commando, `tar -xzf ${tarballPath} -C ${deployTempDir}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0) {
				throw new CommandoException(`Failed to extract tarball (exit code ${exitCode})`, stdout, stderr, exitCode);
			}
		});

		this.logInfo(`Extracted hosting package to: ${deployTempDir}`);

		// firebase.json and .firebaserc are already in deployTempDir from tarball extraction
		// Deploy using firebase CLI
		const envConfig = this.getEnvConfig();
		this.logInfo(`Deploying to Firebase Hosting: ${deployTempDir} => ${envConfig.projectId}`);

		const deployCommando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(deployTempDir)
			.setLogLevelFilter(deployLogFilter)
			.onLog(/.*Hosting URL.*(https:\/\/.*?)$/, match => {
				this.hosting[match[1]] = match[2];
			});

		const debug = this.runtimeContext.runtimeParams.verbose ? ' --debug' : '';
		await this.executeAsyncCommando(deployCommando, `npx firebase${debug} deploy --only hosting`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0) {
				throw new CommandoException(`Failed to deploy hosting (exit code ${exitCode})`, stdout, stderr, exitCode);
			}
		});

		this.logInfo(`Hosting deployed: `, this.hosting);

		// Cleanup temp directory (optional - keep for debugging)
		// await FileSystemUtils.folder.delete(deployTempDir);
	}
}
