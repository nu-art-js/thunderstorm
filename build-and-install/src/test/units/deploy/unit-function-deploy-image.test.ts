// file: ./tests/units/deploy/unit-deploy-image.test.ts
import {DebugFlag, isErrorOfType, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Compile, phase_DeployImage, phase_Install, phase_Prepare, Unit_FirebaseFunctionsApp} from '../../_common.js';
import type {Unit_FirebaseFunctionsApp_Config} from '../../../main/units/implementations/firebase/Unit_FirebaseFunctionsApp.js';
import {PhaseAggregatedException} from '../../../main/exceptions/PhaseAggregatedException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {execSync} from 'child_process';
import {expect} from 'chai';
import {CONST_DeploymentId, CONST_LatestTag} from '../../../main/config/consts.js';
import {CONST_TestFixture_FunctionHello} from './test-consts.js';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../main/config/consts.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);
DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

type Input = {
	fixtures: string[];
	imageTag?: string;
	useDryRun?: boolean;
	deployFunction?: string;
	deleteFunction?: string;
	deleteFunctions?: boolean;
};
type Output = (bai: BuildAndInstall) => Promise<void>;

const params = {
	FIREBASE_TEST_PROJECT: 'nu-art-thunderstorm-test',
	DEPLOYMENT_ID_PLACEHOLDER: 'DEPLOYMENT_ID_PLACEHOLDER'
};

const test = async (setup: Input) => {
	FilesCache.clear();

	// Setup workspace with template parameters for deployment ID replacement
	await workspaceCreator.setupWorkspace(setup.fixtures, params);

	const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	buildAndInstall.runtimeParams.allUnits = true;
	buildAndInstall.runtimeParams.environment = 'test';
	const imageTag = setup.imageTag || CONST_LatestTag;
	buildAndInstall.runtimeParams.deployImage = imageTag;
	// Don't set dryRun yet - we need prepare() to run first to create firebase.json
	if (setup.deployFunction) {
		buildAndInstall.runtimeParams.deployFunction = setup.deployFunction;
	}
	if (setup.deleteFunction) {
		buildAndInstall.runtimeParams.deleteFunction = setup.deleteFunction;
	}
	if (setup.deleteFunctions !== undefined) {
		buildAndInstall.runtimeParams.deleteFunctions = setup.deleteFunctions;
	}

	buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Compile], [phase_DeployImage]]);
	await buildAndInstall.build();

	try {
		await buildAndInstall.run();
	} catch (error: any) {
		// If gcloud/Firebase CLI fails (auth, API not enabled, etc.), that's expected in test environment
		// The test will verify setup (config, firebase.json) which doesn't require deployment to succeed
		if (error instanceof PhaseAggregatedException) {
			// Check if any of the errors are gcloud/Firebase CLI related
			const specificError = error.errors.find(err => {
				const commandoError = isErrorOfType(err.cause, CommandoException);
				if (commandoError) {
					const stderr = commandoError.stderr || '';
					const stdout = commandoError.stdout || '';
					const errorMessage = commandoError.message || '';
					// Common gcloud/Firebase CLI errors that are expected in test environment
					const deployErrors = [
						'ERROR: (gcloud.functions.deploy)',
						'PERMISSION_DENIED',
						'API not enabled',
						'authentication',
						'Could not reach',
						'The required property [project] is not currently set',
						'Failed to deploy function',
						'could not deploy functions',
						'directory was not found',
						'Firebase CLI',
						'not authenticated',
					];
					// Check in stderr, stdout, and error message
					return deployErrors.some(errMsg =>
						stderr.includes(errMsg) ||
						stdout.includes(errMsg) ||
						errorMessage.includes(errMsg)
					);
				}
				return false;
			});

			if (specificError)
				throw specificError;
		}
		// Re-throw other errors
		throw error;
	}
	return buildAndInstall;
};

type TestSuite_DeployImage = TestSuite<Input, Output>;
type TestCase_DeployImage = TestSuite_DeployImage['testcases'][number];

const runTestCase = (testCase: TestCase_DeployImage, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Deploy Image Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt', 'firebase-function-nested-deps.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	it('Functions - Deploy Container Image to Firebase', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: CONST_LatestTag,
			useDryRun: false,
			deleteFunction: 'hello' // Delete function before deploying to ensure fresh deployment
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>(CONST_TestFixture_FunctionHello, Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify containerDeployment config exists
			functionUnit.logDebug('=== Verifying containerDeployment config ===');
			expect(functionUnit.config.containerDeployment).to.exist;
			const containerDeployment = functionUnit.config.containerDeployment!;
			expect(containerDeployment.artifactRegistry).to.exist;

			// Verify firebase.json was created with container image format
			functionUnit.logDebug('=== Verifying firebase.json exists and format ===');
			const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
			expect(existsSync(firebaseJsonPath)).to.be.true;

			const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
			expect(firebaseJson.functions).to.exist;

			// Verify source points to dist directory (not image reference)
			// Container image is specified via --docker-image flag in gcloud deploy, not in firebase.json
			functionUnit.logDebug('=== Verifying firebase.json source configuration ===');
			expect(firebaseJson.functions.source).to.exist;
			expect(firebaseJson.functions.source).to.equal('dist');

			// Verify runtime is not set (container images don't need runtime)
			functionUnit.logDebug('=== Verifying runtime is not set for container deployment ===');
			expect(firebaseJson.functions.runtime).to.be.undefined;

			// Verify .firebaserc was created
			functionUnit.logDebug('=== Verifying .firebaserc exists ===');
			const firebaseRcPath = resolve(functionUnit.config.fullPath, CONST_FirebaseRC);
			expect(existsSync(firebaseRcPath)).to.be.true;

			// Verify output directory exists with files
			functionUnit.logDebug('=== Verifying compiled output files ===');
			const compiledJs = resolve(functionUnit.config.output, 'index.js');
			expect(existsSync(compiledJs)).to.be.true;

			// Verify function URLs were captured (if deployment succeeded)
			functionUnit.logDebug('=== Verifying function URLs were captured ===');
			expect(functionUnit.functions).to.exist;
			expect(Object.keys(functionUnit.functions).length).to.be.greaterThan(0);

			// Verify deployed function and deployment-id label match
			await verifyDeployedFunctionWithLabel(
				containerDeployment,
				bai.runtimeParams.deployImage || CONST_LatestTag,
				functionUnit,
				'hello',
				{message: 'Hello World'}
			);

			functionUnit.logDebug('=== Deploy Image Testing Completed ===');
		}
	})).timeout(300000); // Skip by default - requires Firebase CLI authentication and Docker

	it('Functions - Deploy Image with Custom Image Name', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: CONST_LatestTag,
			useDryRun: false,
			deleteFunction: 'hello' // Delete function before deploying to ensure fresh deployment
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>(CONST_TestFixture_FunctionHello, Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify containerDeployment config exists
			functionUnit.logDebug('=== Verifying containerDeployment config ===');
			expect(functionUnit.config.containerDeployment).to.exist;
			const containerDeployment = functionUnit.config.containerDeployment!;

			// Verify firebase.json uses container image format
			functionUnit.logDebug('=== Verifying firebase.json exists and format ===');
			const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
			expect(existsSync(firebaseJsonPath)).to.be.true;

			const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
			functionUnit.logDebug('=== Verifying firebase.json source configuration ===');
			expect(firebaseJson.functions.source).to.exist;

			// Verify source points to dist directory (not image reference)
			expect(firebaseJson.functions.source).to.equal('dist');

			// Verify function URLs were captured
			functionUnit.logDebug('=== Verifying function URLs were captured ===');
			expect(functionUnit.functions).to.exist;
			expect(Object.keys(functionUnit.functions).length).to.be.greaterThan(0);

			// Verify deployed function and deployment-id label match
			await verifyDeployedFunctionWithLabel(
				containerDeployment,
				bai.runtimeParams.deployImage || CONST_LatestTag,
				functionUnit,
				'hello',
				{message: 'Hello World'}
			);

			functionUnit.logDebug('=== Custom Image Name Deploy Test Completed ===');
		}
	})).timeout(300000);

	it('Functions - Validate Function Existence', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: CONST_LatestTag,
			useDryRun: false,
			deleteFunction: 'hello' // Delete function before deploying to ensure fresh deployment
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>(CONST_TestFixture_FunctionHello, Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify functions config exists and contains 'hello'
			functionUnit.logDebug('=== Verifying functions config exists and contains hello ===');
			expect(functionUnit.config.functions).to.exist;
			expect(functionUnit.config.functions).to.include('hello');

			// The validation happens during deployImage(), so if we get here without error,
			// the function exists in dist/index.js
			functionUnit.logDebug('=== Verifying functions array is not empty ===');
			expect(functionUnit.config.functions.length).to.be.greaterThan(0);

			// Verify containerDeployment config exists
			functionUnit.logDebug('=== Verifying containerDeployment config ===');
			expect(functionUnit.config.containerDeployment).to.exist;
			const containerDeployment = functionUnit.config.containerDeployment!;

			// Verify function URLs were captured
			functionUnit.logDebug('=== Verifying function URLs were captured ===');
			expect(functionUnit.functions).to.exist;
			expect(Object.keys(functionUnit.functions).length).to.be.greaterThan(0);

			// Verify deployed function and deployment-id label match
			await verifyDeployedFunctionWithLabel(
				containerDeployment,
				bai.runtimeParams.deployImage || CONST_LatestTag,
				functionUnit,
				'hello',
				{message: 'Hello World'}
			);

			functionUnit.logDebug('=== Validate Function Existence Test Completed ===');
		}
	})).timeout(300000);


	afterEach(function () {
		if (this.currentTest?.state === 'failed')
			suiteHasFailures = true;

		suiteHasFailures ??= false;
	});

	after(async function () {
		this.timeout(10000);
		await sleep(1000);
		if (suiteHasFailures === false)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});

/**
 * Fetches Docker image labels from Artifact Registry using Docker Registry API v2.
 *
 * @param containerDeployment - Container deployment configuration
 * @param imageTag - Image tag to fetch (defaults to 'latest')
 * @param logger - Optional logger for debug messages
 * @returns Promise resolving to the labels object
 */
async function fetchImageLabels(
	containerDeployment: Unit_FirebaseFunctionsApp_Config['containerDeployment'],
	imageTag: string = 'latest',
	logger?: { logDebug: (message: string, ...args: any[]) => void }
): Promise<Record<string, string>> {
	if (!containerDeployment) {
		throw new Error('containerDeployment config is required');
	}

	const artifactRegistry = containerDeployment.artifactRegistry;
	const imageName = containerDeployment.imageName;

	// Build image reference components
	const registryHost = `${artifactRegistry.region}-docker.pkg.dev`;
	const repoPath = `${artifactRegistry.projectId}/${artifactRegistry.repository}`;

	logger?.logDebug('=== Fetching image labels ===', {registryHost, repoPath, imageName, imageTag});

	// Get access token
	const accessToken = execSync('gcloud auth print-access-token', {encoding: 'utf-8'}).trim();

	// Fetch manifest to get config digest
	const manifestUrl = `https://${registryHost}/v2/${repoPath}/${imageName}/manifests/${imageTag}`;
	const manifestResponse = await fetch(manifestUrl, {
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
		}
	});

	if (!manifestResponse.ok) {
		throw new Error(`Failed to fetch manifest: ${manifestResponse.status} ${manifestResponse.statusText}`);
	}

	const manifest = await manifestResponse.json();
	const configDigest = manifest.config.digest;

	// Fetch config blob
	const configUrl = `https://${registryHost}/v2/${repoPath}/${imageName}/blobs/${configDigest}`;
	const configResponse = await fetch(configUrl, {
		headers: {
			'Authorization': `Bearer ${accessToken}`
		},
		redirect: 'follow' // Follow redirects
	});

	if (!configResponse.ok) {
		throw new Error(`Failed to fetch config blob: ${configResponse.status} ${configResponse.statusText}`);
	}

	const configJson = await configResponse.json();
	const labels = configJson.config?.Labels || {};

	logger?.logDebug('=== Image labels ===', labels);

	return labels;
}

/**
 * Fetches and validates the deployment-id label from a Docker image in Artifact Registry.
 *
 * @param containerDeployment - Container deployment configuration
 * @param imageTag - Image tag to fetch (defaults to 'latest')
 * @param logger - Optional logger for debug messages
 * @returns Promise resolving to the deployment-id label value
 * @throws If deployment-id label is missing or invalid
 */
async function fetchDeploymentIdLabel(
	containerDeployment: Unit_FirebaseFunctionsApp_Config['containerDeployment'],
	imageTag: string = 'latest',
	logger?: { logDebug: (message: string, ...args: any[]) => void }
): Promise<string> {
	logger?.logDebug('=== Fetching deployment-id label from image ===');

	const labels = await fetchImageLabels(containerDeployment, imageTag, logger);

	// Verify deployment-id label exists
	if (!labels[CONST_DeploymentId]) {
		throw new Error('deployment-id label not found in image');
	}

	const deploymentIdFromLabel = labels[CONST_DeploymentId];
	if (typeof deploymentIdFromLabel !== 'string') {
		throw new Error(`deployment-id label must be a string, got ${typeof deploymentIdFromLabel}`);
	}

	return deploymentIdFromLabel;
}

/**
 * Verifies a deployed function by:
 * 1. Fetching the deployment-id label from the Docker image
 * 2. Verifying the function URL exists
 * 3. Making an HTTP request to the function
 * 4. Validating the response matches expected data
 * 5. Verifying the deployment-id from the label matches the response
 *
 * @param containerDeployment - Container deployment configuration
 * @param imageTag - Image tag to fetch (defaults to 'latest')
 * @param functionUnit - Firebase Functions unit with function URLs
 * @param functionName - Name of the function to verify
 * @param expectedData - Expected data in the function response (partial match)
 * @param logger - Optional logger for debug messages
 * @throws If any verification step fails
 */
async function verifyDeployedFunctionWithLabel(
	containerDeployment: Unit_FirebaseFunctionsApp_Config['containerDeployment'],
	imageTag: string,
	functionUnit: Unit_FirebaseFunctionsApp,
	functionName: string,
	expectedData: Record<string, any>,
	logger?: { logDebug: (message: string, ...args: any[]) => void }
): Promise<void> {
	// Fetch deployment-id label from Docker image
	const deploymentIdFromLabel = await fetchDeploymentIdLabel(
		containerDeployment,
		imageTag,
		logger || functionUnit
	);

	// Verify function URL exists
	const functionUrl = functionUnit.functions[functionName];
	expect(functionUrl).to.exist;
	expect(functionUrl).to.include('https://');

	// Verify deployed function via HTTP request
	(logger || functionUnit).logDebug('=== Verifying deployed function via HTTP request ===');
	const response = await fetch(functionUrl);
	expect(response.ok).to.be.true;

	const data = await response.json();

	// Verify expected data matches
	for (const [key, value] of Object.entries(expectedData)) {
		expect(data[key]).to.equal(value);
	}

	// Verify deployment-id exists and matches label
	expect(data.deploymentId).to.exist;
	expect(data.deploymentId).to.equal(deploymentIdFromLabel);
}

