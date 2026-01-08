import {UnitPhaseImplementor} from '../../../core/types.js';
import {CONST_BuildImageDir, CONST_FirebaseJSON, CONST_FirebaseRC, CONST_LatestTag, CONST_PackageJSON, CONST_TrashDir, CONST_VersionApp} from '../../../config/consts.js';
import {FirebasePackageConfig} from '../../../config/types/index.js';
import {__stringify, _keys, _logger_logPrefixes, deepClone, ImplementationMissingException, LogLevel, Second, sleep, StringMap} from '@nu-art/ts-common';
import {Const_FirebaseConfigKeys, Const_FirebaseDefaultsKeyToFile, FunctionBuildTemplateFiles} from '../../../templates/consts.js';
import {Commando_NVM} from '@nu-art/commando/shell/plugins/nvm';
import {Phase_BuildPushImage, Phase_Deploy, Phase_DeployImage, Phase_Launch} from '../../../phases/definitions/index.js';
import {resolve} from 'path';
import {DEFAULT_OLD_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {Unit_TypescriptLib, Unit_TypescriptLib_Config} from '../Unit_TypescriptLib.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {deployLogFilter, ensureArtifactRegistryRepository} from './common.js';

export const firebaseFunctionEmulator_ErrorStrings: string[] = [
	'functions: Failed',
];

export const firebaseFunctionEmulator_WarningStrings: string[] = [
	'⚠',
];

type EnvConfig = { defaultConfig?: string, envConfig?: string, projectId: string, isLocal?: boolean };

export type FunctionTriggerType = 'http' | 'schedule' | 'eventarc';

export type FunctionResourceConfig = {
	cpu?: string | number; // CPU allocation (e.g., '1', '2', '4' or 1, 2, 4)
	memory?: string;       // Memory allocation (e.g., '512Mi', '1Gi', '2Gi', '4Gi', '8Gi')
	timeout?: number;      // Timeout in seconds (default: 300, max: 3600)
	concurrency?: number; // Container concurrency (default: 80, max: 1000)
	minInstances?: number; // Minimum number of instances (default: 0)
	maxInstances?: number; // Maximum number of instances (default: 100)
};

export type FunctionConfig = {
	name: string;          // Function name (must match exported function name)
	trigger: FunctionTriggerType; // Trigger type: 'http', 'schedule', or 'eventarc'
	schedule?: string;    // Schedule expression (required for 'schedule' trigger, e.g., 'every 24 hours', '0 2 * * *')
	serviceAccountName?: string; // Optional: Service account email (if omitted, uses default Cloud Run service account)
	resources?: FunctionResourceConfig; // Per-function resource configuration
};

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
	// Support both legacy format (string[]) and new format (FunctionConfig[])
	functions: string[] | FunctionConfig[]; // Array of function names (legacy) or function configs
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
	public injectedMetadata: StringMap = {};

	static staggerCount: number = 0;
	static DefaultConfig_FirebaseFunction = {
		pathToFirebaseConfig: '.firebase_config',
		debugPort: 8100,
		basePort: 8102,
		sslKey: '.ssl/key.pem',
		sslCert: '.ssl/cert.pem',
		output: 'dist',
		pathToEmulatorData: `${CONST_TrashDir}/data`,
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
	 * 4. Creates isolated staging directory with only required files (dist/, Dockerfile, .cloudbuild.yaml)
	 * 5. Builds and pushes image using Google Cloud Build from staging directory (no local Docker required)
	 *
	 * **Staging Directory Structure**:
	 * - `dist/` - Contains compiled code and package.json (copied from output)
	 * - `Dockerfile` - Container build instructions
	 * - `.cloudbuild.yaml` - Cloud Build configuration
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
		const imageReferenceLatest = `${artifactRegistryPath}/${imageName}:latest`;

		this.logInfo(`Building and pushing container image using Cloud Build:`);
		this.logInfo(`  Tagged: ${imageReference}`);
		this.logInfo(`  Latest: ${imageReferenceLatest}`);

		// Check for dry run mode
		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would build and push image: ${imageReference} and ${imageReferenceLatest}`);
			return;
		}

		// Ensure Artifact Registry repository exists
		const commando = this.allocateCommando();
		await ensureArtifactRegistryRepository(
			commando,
			artifactRegistry,
			'docker',
			this
		);

		// Create isolated staging directory for container build
		// This ensures we have full control over what goes into the image
		const buildOutputDir = resolve(this.config.fullPath, CONST_TrashDir);
		const stagingDir = resolve(buildOutputDir, CONST_BuildImageDir);
		await FileSystemUtils.folder.delete(stagingDir);
		await FileSystemUtils.folder.create(stagingDir);

		// Copy only what's needed: the entire dist folder (which contains package.json)
		const distTargetPath = resolve(stagingDir, 'dist');
		await FileSystemUtils.folder.copy(this.config.output, distTargetPath);

		this.logInfo(`Created staging directory at ${stagingDir}`);
		this.logInfo(`  - Copied dist/ from ${this.config.output} (includes package.json)`);

		// Generate Dockerfile in staging directory
		// Build context will be staging directory
		const dockerfileName = containerDeployment.dockerfile || 'Dockerfile';
		const dockerfilePath = resolve(stagingDir, dockerfileName);
		await FileSystemUtils.file.template.copy(FunctionBuildTemplateFiles.dockerfile, dockerfilePath, {});
		this.logInfo(`Created Dockerfile at ${dockerfilePath}`);

		const metadata = {
			...this.injectedMetadata,
			'build.timestamp': new Date().toISOString(),
			'build.tag': imageTag,
			'build.project': artifactRegistry.projectId,
			'build.image-name': imageName,
			'version': this.runtimeContext.version,
			'git.commit': process.env.GIT_COMMIT || '',
			'git.branch': process.env.GIT_BRANCH || '',
			'build.user': process.env.USER || '',
		};

		this.logDebug(`Metadata: `, metadata);
		const labels = Object.entries(metadata)
			.map(([key, value]) => `      - '--label=${key}=${value}'`)
			.join('\n');

		const params = {
			IMAGE_REFERENCE: imageReference,
			IMAGE_REFERENCE_LATEST: imageReferenceLatest,
			DOCKERFILE_PATH: dockerfileName,  // Simple path since build context is staging dir
			LABELS: labels
		};

		// Generate cloudbuild.yaml in staging directory
		const cloudbuildYamlPath = resolve(stagingDir, '.cloudbuild.yaml');
		await FileSystemUtils.file.template.copy(FunctionBuildTemplateFiles.cloudbuildYaml, cloudbuildYamlPath, params);

		// Build from staging directory - this ensures only staging contents are uploaded
		commando.cd(stagingDir);
		await this.executeAsyncCommando(commando, `gcloud builds submit --config .cloudbuild.yaml --project ${artifactRegistry.projectId} .`, (stdout, stderr, exitCode) => {
			if (exitCode === 0)
				return;

			throw new CommandoException(`Failed to build and push Docker image with Cloud Build (exit code ${exitCode})`, stdout, stderr, exitCode);
		});

		this.logInfo(`Successfully built and pushed images: ${imageReference} and ${imageReferenceLatest}`);
	}

	/**
	 * Discovers exported functions from the compiled dist/index.js file.
	 * Parses export statements to extract function names.
	 *
	 * @returns Array of function names found in exports
	 */
	private async discoverExportedFunctions(): Promise<string[]> {
		const indexPath = resolve(this.config.output, 'index.js');
		const content = await FileSystemUtils.file.read(indexPath);

		const functionNames: string[] = [];
		// Match patterns like: export const hello = ... or export const helloWorld = ...
		const exportConstRegex = /export\s+const\s+(\w+)\s*=/g;
		let match;
		while ((match = exportConstRegex.exec(content)) !== null) {
			functionNames.push(match[1]);
		}

		return functionNames;
	}

	/**
	 * Normalizes function configuration to FunctionConfig[] format.
	 * Handles both legacy format (string[]) and new format (FunctionConfig[]).
	 */
	private normalizeFunctionConfigs(): FunctionConfig[] {
		if (this.config.functions.length === 0)
			return [];

		// Check if it's already in FunctionConfig format
		if (typeof this.config.functions[0] === 'object') {
			return this.config.functions as FunctionConfig[];
		}

		// Legacy format: convert string[] to FunctionConfig[]
		return (this.config.functions as string[]).map(name => ({
			name,
			trigger: 'http' as FunctionTriggerType
		}));
	}

	/**
	 * Gets function names from configuration (for backward compatibility).
	 */
	private getFunctionNames(): string[] {
		return this.normalizeFunctionConfigs().map(f => f.name);
	}

	/**
	 * Gets function config by name.
	 */
	private getFunctionConfig(functionName: string): FunctionConfig | undefined {
		return this.normalizeFunctionConfigs().find(f => f.name === functionName);
	}

	/**
	 * Validates that all configured functions exist in the compiled dist/index.js file.
	 * Throws ImplementationMissingException if any configured function is missing.
	 */
	private async validateFunctionsExist(): Promise<void> {
		const configuredFunctions = this.normalizeFunctionConfigs();
		const functionNames = configuredFunctions.map(f => f.name);
		const exportedFunctions = await this.discoverExportedFunctions();
		const exportedSet = new Set(exportedFunctions);

		const missingFunctions = functionNames.filter(func => !exportedSet.has(func));
		if (missingFunctions.length > 0) {

			throw new ImplementationMissingException(
				`Configured functions not found in dist/index.js: ${missingFunctions.join(', ')}. ` +
				`Available exports: ${exportedFunctions.length > 0 ? exportedFunctions.join(', ') : 'none'}`
			);
		}
	}

	/**
	 * Deletes a single function using gcloud run services delete.
	 *
	 * @param functionName Name of the function to delete (original function name with underscores)
	 */
	private async deleteFunction(functionName: string): Promise<void> {
		const containerDeployment = this.config.containerDeployment;
		if (!containerDeployment) {
			throw new ImplementationMissingException(`Missing containerDeployment config in unit ${this.config.key}`);
		}

		const artifactRegistry = containerDeployment.artifactRegistry;
		const region = artifactRegistry.region;
		// Use runtime project ID (where function is deployed), not Artifact Registry project ID
		const envConfig = this.getEnvConfig();
		const runtimeProjectId = envConfig.projectId;

		// Cloud Run service names cannot contain underscores, convert to dashes
		const serviceName = functionName.replace(/_/g, '-');

		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter);

		// Use gcloud run services delete (Gen2 functions run on Cloud Run)
		const deleteCommand = `gcloud run services delete ${serviceName} --region=${region} --project=${runtimeProjectId} --quiet`;

		// Check for dry run mode
		if (this.runtimeContext.runtimeParams.dryRun) {
			this.logInfo(`[DRY RUN] Would execute: ${deleteCommand}`);
			return;
		}

		this.logInfo(`Deleting function: ${functionName} (service: ${serviceName})`);
		await this.executeAsyncCommando(commando, deleteCommand, (stdout, stderr, exitCode) => {
			// Ignore errors for non-existent functions (function might already be deleted)
			if (exitCode === 0)
				return;

			// Check if error is about function/service not found
			// gcloud returns various messages like "could not be found", "not found", "does not exist"
			const errorText = (stderr || stdout || '').toLowerCase();
			const notFoundPatterns = [
				'not found',
				'could not be found',
				'does not exist',
				'cannot be found',
				'no such service'
			];
			
			if (notFoundPatterns.some(pattern => errorText.includes(pattern))) {
				this.logWarning(`Function ${functionName} not found (may already be deleted)`);
				return;
			}

			// Re-throw other errors
			throw new CommandoException(`Failed to delete function ${functionName} with exit code ${exitCode}`, stdout, stderr, exitCode);
		});
	}

	/**
	 * Deletes multiple functions.
	 * Determines which functions to delete based on CLI parameters.
	 *
	 * @returns Array of function names that were deleted (or would be deleted in dry run)
	 */
	private async deleteFunctions() {
		const deleteFunctionParam = this.runtimeContext.runtimeParams.deleteFunction;
		const deleteFunctionsFlag = this.runtimeContext.runtimeParams.deleteFunctions;
		const deployFunctionParam = this.runtimeContext.runtimeParams.deployFunction;

		const functionNames = this.getFunctionNames();
		let functionsToDelete: string[] = [];

		// Determine which functions to delete
		if (deleteFunctionParam) {
			// Delete specific function
			functionsToDelete = [deleteFunctionParam];
		} else if (deleteFunctionsFlag) {
			// Delete based on context
			if (deployFunctionParam) {
				// Delete only the function being deployed
				functionsToDelete = [deployFunctionParam];
			} else {
				// Delete all functions from config
				functionsToDelete = functionNames;
			}
		}

		if (functionsToDelete.length === 0) {
			return [];
		}

		this.logInfo(`Deleting ${functionsToDelete.length} function(s): ${functionsToDelete.join(', ')}`);

		// Delete each function
		for (const functionName of functionsToDelete) {
			await this.deleteFunction(functionName);
		}

		if (functionsToDelete.length > 0) {
			this.logInfo(`Deleted ${functionsToDelete.length} function(s) before deployment`);
		}

	}

	/**
	 * Deploys container image from Artifact Registry to Firebase Functions using gcloud.
	 *
	 * **Process**:
	 * 1. Validates image tag is provided via CLI
	 * 2. Validates containerDeployment config exists
	 * 3. Validates configured functions exist in dist/index.js
	 * 4. Deletes functions if requested via CLI flags
	 * 5. Determines which functions to deploy (single or all)
	 * 6. Generates Cloud Run service YAML definitions for each function
	 * 7. Sets required environment variables (FIREBASE_CONFIG, GCLOUD_PROJECT, FUNCTION_TARGET, etc.)
	 * 8. Deploys each function using `gcloud run services replace` with YAML definition
	 * 9. Retrieves function URLs after successful deployment
	 *
	 * **Environment Variables Set**:
	 * - `FUNCTION_TARGET`: Function name to invoke
	 * - `GCLOUD_PROJECT`: Runtime project ID
	 * - `GOOGLE_CLOUD_PROJECT`: Runtime project ID (alternative)
	 * - `FIREBASE_CONFIG`: JSON string with projectId, databaseURL, storageBucket, locationId
	 * - `EVENTARC_CLOUD_EVENT_SOURCE`: Eventarc source path
	 * - `LOG_EXECUTION_ID`: Set to 'true' for execution ID logging
	 *
	 * **Function Configuration**:
	 * Functions can be configured in two formats:
	 * 1. **Legacy format** (string[]): Simple array of function names (all default to HTTP trigger)
	 * 2. **New format** (FunctionConfig[]): Array of function config objects with:
	 *    - `name`: Function name (must match exported function name)
	 *    - `trigger`: Trigger type ('http', 'schedule', or 'eventarc')
	 *    - `schedule`: Schedule expression (required for 'schedule' trigger, e.g., 'every 24 hours', '0 2 * * *')
	 *    - `resources`: Per-function resource configuration:
	 *      - `cpu`: CPU allocation (e.g., '1', '2', '4')
	 *      - `memory`: Memory allocation (e.g., '512Mi', '1Gi', '2Gi', '4Gi', '8Gi')
	 *      - `timeout`: Timeout in seconds (default: 300, max: 3600)
	 *      - `concurrency`: Container concurrency (default: 80, max: 1000)
	 *      - `minInstances`: Minimum number of instances (default: 0)
	 *      - `maxInstances`: Maximum number of instances (default: 100)
	 *
	 * **Trigger Types**:
	 * - `http`: HTTP-triggered function (deployed as Cloud Run service)
	 * - `schedule`: Scheduled function (requires `schedule` property, deployed as Cloud Run service with Cloud Scheduler)
	 * - `eventarc`: Event-triggered function (deployed as Cloud Run service with Eventarc)
	 *
	 * **Requirements**:
	 * - `--deploy-image <tag>` CLI flag with tag value
	 * - `containerDeployment` config in unit config
	 * - `functions` array in unit config (legacy or new format)
	 * - Image must already exist in Artifact Registry (built via buildPushImage)
	 * - gcloud CLI installed and authenticated
	 * - Cloud Functions API enabled in GCP project
	 * - Cloud Scheduler API enabled (for scheduled functions)
	 *
	 * **Note on Request Size Limits**:
	 * The `PayloadTooLargeError` is typically caused by Express body-parser limits, not Cloud Run limits.
	 * Configure `bodyParserLimit` in your HttpServer module config to increase the limit (default: 200kb).
	 * Cloud Run supports request bodies up to 32MB, but Express must be configured to accept them.
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
		// Use 'latest' tag if no specific tag provided, otherwise use the provided tag
		const imageTagToUse = imageTag || CONST_LatestTag;
		const imageReference = `${artifactRegistryPath}/${imageName}:${imageTagToUse}`;

		this.logInfo(`Deploying container image: ${imageReference}`);

		// Validate that configured functions exist in compiled code
		await this.validateFunctionsExist();

		// Delete functions if requested
		await this.deleteFunctions();

		// Determine which functions to deploy
		const deployFunctionParam = this.runtimeContext.runtimeParams.deployFunction;
		const allFunctionConfigs = this.normalizeFunctionConfigs();
		let functionsToDeploy: FunctionConfig[];

		if (deployFunctionParam) {
			// Deploy single function
			const functionConfig = this.getFunctionConfig(deployFunctionParam);
			if (!functionConfig) {
				const functionNames = this.getFunctionNames();
				throw new ImplementationMissingException(`Function '${deployFunctionParam}' not found in configured functions: ${functionNames.join(', ')}`);
			}
			functionsToDeploy = [functionConfig];
		} else {
			// Deploy all functions from config
			functionsToDeploy = allFunctionConfigs;
		}

		const region = artifactRegistry.region;
		// Use runtime project ID (where function is deployed), not Artifact Registry project ID
		const envConfig = this.getEnvConfig();
		const runtimeProjectId = envConfig.projectId;

		// Deploy each function separately with the same image but different entry points
		const commando = this.allocateCommando(Commando_NVM).applyNVM()
			.cd(this.config.fullPath)
			.setLogLevelFilter(deployLogFilter);


		this.logInfo(`Deploying ${functionsToDeploy.length} function(s): ${functionsToDeploy.map(f => f.name).join(', ')}`);

		// Deploy each function
		for (const functionConfig of functionsToDeploy) {
			const functionName = functionConfig.name;
			const trigger = functionConfig.trigger;

			// Cloud Run service names cannot contain underscores, convert to dashes
			// But FUNCTION_TARGET must use the original function name (with underscore) as it's exported in code
			const serviceName = functionName.replace(/_/g, '-');

			this.logInfo(`Deploying function: ${functionName}`);
			this.logInfo(`  Service name: ${serviceName} (Cloud Run requires dashes, not underscores)`);
			this.logInfo(`  Function target: ${functionName} (original function name for FUNCTION_TARGET)`);
			this.logInfo(`  Trigger type: ${trigger}`);

			// Validate trigger-specific requirements
			if (trigger === 'schedule' && !functionConfig.schedule) {
				throw new ImplementationMissingException(`Function '${functionName}' has trigger type 'schedule' but no schedule expression is configured. Add 'schedule' property to function config.`);
			}

			// Construct Firebase configuration JSON (matches Firebase Functions deployment format)
			// Convert region format (e.g., "us-central1" -> "us-central")
			const locationId = region.replace(/\d+$/, ''); // Remove trailing digits
			const firebaseConfig = {
				projectId: runtimeProjectId,
				databaseURL: `https://${runtimeProjectId}-default-rtdb.firebaseio.com`,
				storageBucket: `${runtimeProjectId}.appspot.com`,
				locationId: locationId
			};

			// Set required environment variables for Firebase Admin SDK
			// FIREBASE_CONFIG is required by Firebase Admin SDK to determine database URL and other services
			// Use env-vars-file to avoid shell escaping issues with JSON values containing special characters
			const firebaseConfigJson = JSON.stringify(firebaseConfig);
			
			// Create temporary file for environment variables
			// This avoids shell escaping issues with JSON values containing braces, commas, and quotes
			const buildOutputDir = resolve(this.config.fullPath, CONST_TrashDir);
			const envVarsFile = resolve(buildOutputDir, `env-vars-${functionName}.json`);
			const envVars: Record<string, string> = {
				FUNCTION_TARGET: functionName,
				GCLOUD_PROJECT: runtimeProjectId,
				GOOGLE_CLOUD_PROJECT: runtimeProjectId,
				FIREBASE_CONFIG: firebaseConfigJson,
				EVENTARC_CLOUD_EVENT_SOURCE: `projects/${runtimeProjectId}/locations/${region}/services/${serviceName}`,
				LOG_EXECUTION_ID: 'true'
			};

			// Add schedule-specific environment variable if needed
			if (trigger === 'schedule' && functionConfig.schedule) {
				envVars.SCHEDULE = functionConfig.schedule;
			}

			await FileSystemUtils.file.write.json(envVarsFile, envVars);

			// Build Cloud Run service YAML definition using template
			const resources = functionConfig.resources;
			
			// Generate environment variables as YAML array
			// Indentation: 8 spaces for list item, 10 spaces for value (under env: which is at 8 spaces)
			const envVarsYaml = Object.entries(envVars)
				.map(([name, value]) => {
					// Always quote string values to prevent YAML from interpreting them as booleans/numbers
					// This is critical for values like 'true', 'false', 'yes', 'no', etc.
					const escapedValue = typeof value === 'string'
						? JSON.stringify(value) // JSON.stringify adds quotes and escapes special characters
						: value;
					return `        - name: ${name}\n          value: ${escapedValue}`;
				})
				.join('\n');

			// Generate service account line conditionally
			const serviceAccountYaml = functionConfig.serviceAccountName
				? `      serviceAccountName: ${functionConfig.serviceAccountName}`
				: '';

			// Build template parameters
			// Convert cpu to string if it's a number
			const cpuValue = resources?.cpu !== undefined 
				? (typeof resources.cpu === 'number' ? resources.cpu.toString() : resources.cpu)
				: '1';
			
			const serviceYamlParams = {
				SERVICE_NAME: serviceName,
				FUNCTION_NAME: functionName,
				REGION: region,
				RUNTIME_PROJECT_ID: runtimeProjectId,
				IMAGE_REFERENCE: imageReference,
				TRIGGER_TYPE: trigger === 'http' ? 'HTTP_TRIGGER' : 'EVENT_TRIGGER',
				MAX_INSTANCES: (resources?.maxInstances ?? 100).toString(),
				MIN_INSTANCES: (resources?.minInstances ?? 0).toString(),
				CONCURRENCY: (resources?.concurrency ?? 100).toString(),
				TIMEOUT: (resources?.timeout ?? 540).toString(),
				CPU: cpuValue,
				MEMORY: resources?.memory || '2Gi',
				ENV_VARS: envVarsYaml,
				SERVICE_ACCOUNT: serviceAccountYaml
			};

			// Generate service YAML from template
			const serviceYamlFile = resolve(buildOutputDir, `service-${functionName}.yaml`);
			await FileSystemUtils.file.template.copy(FunctionBuildTemplateFiles.serviceYaml, serviceYamlFile, serviceYamlParams);
			this.logInfo(`Created service YAML at ${serviceYamlFile}`);

			// Deploy using gcloud run services replace
			const serviceYamlFileRelative = serviceYamlFile.replace(`${this.config.fullPath}/`, '');
			const gcloudDeployCommand = `gcloud run services replace ${serviceYamlFileRelative} --region=${region} --project=${runtimeProjectId}`;
			
			if (this.runtimeContext.runtimeParams.dryRun) {
				this.logInfo(`[DRY RUN] Would execute: ${gcloudDeployCommand}`);
				continue;
			}

			await this.executeAsyncCommando(commando, gcloudDeployCommand, (stdout, stderr, exitCode) => {
				if (exitCode === 0) {
					// Get service URL after successful deployment
					return;
				}

				throw new CommandoException(`Failed to deploy function ${functionName} with exit code ${exitCode}`, stdout, stderr, exitCode);
			});

			// Get service URL after deployment
			const getUrlCommand = `gcloud run services describe ${serviceName} --region=${region} --project=${runtimeProjectId} --format="value(status.url)"`;
			await this.executeAsyncCommando(commando, getUrlCommand, (stdout, stderr, exitCode) => {
				if (exitCode === 0) {
					const url = stdout.trim();
					if (url) {
						this.functions[functionName] = url;
						this.logInfo(`Function ${functionName} deployed at: ${url}`);
					}
					return;
				}

				// URL retrieval failure is not critical, log warning but don't fail
				this.logWarning(`Failed to retrieve URL for function ${functionName}: ${stderr || stdout}`);
			});
		}

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
			// For container deployment, source must still point to a directory (for compatibility)
			// The container image is specified via --docker-image flag in gcloud functions deploy
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

