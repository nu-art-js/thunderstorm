import {FirebasePackageConfig} from '../../../config/types/index.js';
import {UnitPhaseImplementor} from '../../../core/types.js';
import {ImplementationMissingException, StringMap, TS_Object} from '@nu-art/ts-common';
import {
	CONST_DeployHostingDir,
	CONST_DeploymentMetadata,
	CONST_FirebaseJSON,
	CONST_FirebaseRC,
	CONST_HostingBuildTarball,
	CONST_StagingDir,
	CONST_TrashDir,
	CONST_VersionApp
} from '../../../config/consts.js';
import {Commando_NVM, CommandoException} from '@nu-art/commando';
import {resolve} from 'path';
import {Phase_BuildPushImage, Phase_Deploy, Phase_DeployImage, Phase_Launch} from '../../../phases/definitions/index.js';
import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../Unit_TypescriptLib.js';
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

export type Unit_HostingApp_Config = Unit_TypescriptLib_Config & {
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
		packageName: string;
	};
};

/**
 * Abstract base for hosting application units (Firebase Hosting with webpack or Vite).
 * Handles Firebase config resolution, deploy, buildPushImage, deployImage.
 * Subclasses implement compileImpl() and runApp() for the specific bundler.
 */
export abstract class Unit_HostingApp<C extends Unit_HostingApp_Config = Unit_HostingApp_Config>
	extends Unit_TypescriptLib<C>
	implements UnitPhaseImplementor<[Phase_Launch, Phase_Deploy, Phase_BuildPushImage, Phase_DeployImage]> {

	public hosting: StringMap = {};
	public injectedMetadata: StringMap = {};

	static DefaultConfig_Hosting = {
		servingPort: 8100,
		output: 'dist',
	};

	constructor(config: Unit_HostingApp<C>['config']) {
		super(config);
		this.addToClassStack(Unit_HostingApp);
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
		await this.releasePorts([`${this.config.servingPort}`]);
		await this.runApp();
	}

	async deploy() {
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter)
			.onLog(/.*Hosting URL.*(https:\/\/.*?)$/, match => {
				this.hosting[match[1]] = match[2];
			});

		const debug = this.runtimeContext.runtimeParams.verbose ? ' --debug' : '';
		await this.executeAsyncCommando(commando, `${this.npmCommand('firebase')}${debug} deploy --only hosting`);
	}

	//######################### ResolveConfig Logic #########################

	protected getEnvConfig() {
		const envConfig = this.config.envConfig;
		if (!envConfig)
			throw new ImplementationMissingException(`Missing EnvConfig in unit ${this.config.label}`);

		return envConfig;
	}

	private async resolveHostingRC() {
		const envConfig = this.getEnvConfig();
		const rcConfig = {projects: {default: envConfig.projectId}};
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
						{'source': '**', 'destination': '/index.html'}
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

	//######################### Compile / Launch (abstract) #########################

	protected abstract compileImpl(): Promise<void>;
	protected abstract runApp(): Promise<void>;

	//######################### Shared helpers #########################

	protected async createAppVersionFile() {
		const targetPath = `${this.config.fullPath}/src/main/${CONST_VersionApp}`;
		const appVersion = this.runtimeContext.version;
		await FileSystemUtils.file.write.json(targetPath, {version: appVersion});
	}

	//######################### Build Push Image Phase #########################

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
		const packageName = hostingDeployment.packageName;
		if (!packageName) {
			throw new ImplementationMissingException(`Missing packageName in hostingDeployment config for unit ${this.config.key}`);
		}

		this.logInfo(`Building and uploading hosting package to Artifact Registry:`);
		this.logInfo(`  Package: ${packageName}`);
		this.logInfo(`  Tag: ${buildTag}`);

		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would build and upload hosting package: ${packageName}:${buildTag}`);
			return;
		}

		const commando = this.allocateCommando();
		await ensureArtifactRegistryRepository(
			commando,
			artifactRegistry,
			'generic',
			this
		);

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

		const buildOutputDir = resolve(this.config.fullPath, CONST_TrashDir);
		const stagingDir = resolve(buildOutputDir, CONST_StagingDir);
		await FileSystemUtils.folder.delete(stagingDir);
		await FileSystemUtils.folder.create(stagingDir);
		const tarballPath = resolve(buildOutputDir, CONST_HostingBuildTarball);

		const outputDirName = resolve(this.config.output).split('/').pop() || 'dist';

		await FileSystemUtils.folder.copy(this.config.output, resolve(stagingDir, outputDirName));
		await FileSystemUtils.file.write.json(resolve(stagingDir, CONST_DeploymentMetadata), metadata);

		commando.cd(stagingDir);
		await this.executeAsyncCommando(commando, `tar -czf ${tarballPath} ${CONST_DeploymentMetadata} ${outputDirName}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to create tarball (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Created tarball: ${tarballPath}`);

		const region = artifactRegistry.region;
		const repository = artifactRegistry.repository;
		const projectId = artifactRegistry.projectId;

		await this.executeAsyncCommando(commando, `gcloud artifacts generic upload --package=${packageName} --version=${buildTag} --source=${tarballPath} --location=${region} --repository=${repository} --project=${projectId}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to upload hosting package to Artifact Registry (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Successfully uploaded hosting package: ${packageName}:${buildTag} and ${packageName}:latest`);
	}

	//######################### Deploy Image Phase #########################

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
		const packageName = hostingDeployment.packageName;
		if (!packageName) {
			throw new ImplementationMissingException(`Missing packageName in hostingDeployment config for unit ${this.config.key}`);
		}
		const region = artifactRegistry.region;
		const repository = artifactRegistry.repository;
		const projectId = artifactRegistry.projectId;

		this.logInfo(`Deploying hosting package: ${packageName}:${deployTag}`);

		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would deploy hosting package: ${packageName}:${deployTag}`);
			return;
		}

		const deployTempDir = resolve(this.config.fullPath, `${CONST_TrashDir}/${CONST_DeployHostingDir}`);
		this.logInfo(`Setting up deployment directory: ${deployTempDir}`);
		await FileSystemUtils.folder.delete(deployTempDir);
		await FileSystemUtils.folder.create(deployTempDir);

		const commando = this.allocateCommando(Commando_NVM)
			.applyNVM()
			.cd(deployTempDir)
			.mark();

		this.logInfo(`Downloading hosting package from Artifact Registry from: ${projectId}/${repository}/${packageName}/${deployTag}`);

		await this.executeAsyncCommando(commando, `gcloud artifacts generic download --package=${packageName} --version=${deployTag} --destination=${deployTempDir} --location=${region} --repository=${repository} --project=${projectId}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new CommandoException(`Failed to download hosting package from Artifact Registry (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Locating downloaded tarball...`);
		const downloadedFiles = await FileSystemUtils.folder.list(deployTempDir);
		const tarballFile = downloadedFiles.find(file => file.endsWith('.tar.gz'));
		if (!tarballFile)
			throw new ImplementationMissingException(`Downloaded tarball not found in ${deployTempDir}. Files found: ${downloadedFiles.join(', ')}`);

		const tarballPath = resolve(deployTempDir, tarballFile);
		this.logDebug(`Downloaded tarball: ${tarballPath}`);

		this.logInfo(`Extracting hosting package...`);
		await this.executeAsyncCommando(commando, `tar -xzf ${tarballPath} -C ${deployTempDir}`, (stdout, stderr, exitCode) => {
			if (exitCode !== 0) {
				throw new CommandoException(`Failed to extract tarball (exit code ${exitCode})`, stdout, stderr, exitCode);
			}
		});
		this.logInfo(`Extracted hosting package to: ${deployTempDir}`);

		this.logInfo(`Copying firebase configs..`);
		const firebaseJsonPath = resolve(this.config.fullPath, CONST_FirebaseJSON);
		const firebaseRcPath = resolve(this.config.fullPath, CONST_FirebaseRC);
		await FileSystemUtils.file.copy(firebaseJsonPath, resolve(deployTempDir, CONST_FirebaseJSON));
		await FileSystemUtils.file.copy(firebaseRcPath, resolve(deployTempDir, CONST_FirebaseRC));
		this.logDebug(`Copied firebase configs!`);

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
	}
}
