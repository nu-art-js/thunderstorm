// file: ./tests/units/deploy/unit-deploy-hosting.test.ts
import {DebugFlag, isErrorOfType, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Compile, phase_DeployImage, phase_Install, phase_Prepare, Unit_FirebaseHostingApp} from '../../_common.js';
import {PhaseAggregatedException} from '../../../main/exceptions/PhaseAggregatedException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {CONST_DeployHostingDir, CONST_DeploymentId, CONST_DeploymentMetadata, CONST_TrashDir} from '../../../main/config/consts.js';
import {CONST_TestFixture_HostingHello} from './test-consts.js';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
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
	const imageTag = setup.imageTag;
	if (!imageTag) {
		throw new Error('imageTag is required for hosting deploy tests. Generic packages require a specific version tag (cannot use "latest")');
	}
	buildAndInstall.runtimeParams.deployImage = imageTag;

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
						'ERROR: (gcloud.artifacts)',
						'ERROR: (gcloud.functions.deploy)',
						'PERMISSION_DENIED',
						'NOT_FOUND',
						'API not enabled',
						'authentication',
						'Could not reach',
						'The required property [project] is not currently set',
						'Failed to deploy',
						'could not deploy',
						'directory was not found',
						'Firebase CLI',
						'not authenticated',
						'Repository',
						'not found',
						'repository does not exist',
						'Package',
						'Version',
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

type TestSuite_DeployHosting = TestSuite<Input, Output>;
type TestCase_DeployHosting = TestSuite_DeployHosting['testcases'][number];

const runTestCase = (testCase: TestCase_DeployHosting, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Deploy Hosting Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	it('Hosting - Deploy from Artifact Registry', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-hosting-hello.txt'],
			imageTag: 'test-build-hosting-v1.0.0', // Must match a version that was built
		},
		result: async (bai: BuildAndInstall) => {
			const hostingUnit = bai.workspace.getUnitByKey<Unit_FirebaseHostingApp>(CONST_TestFixture_HostingHello, Unit_FirebaseHostingApp);
			hostingUnit.logDebug('=== Verifying hosting unit exists ===');
			expect(hostingUnit).to.exist;

			// Verify hostingDeployment config exists
			hostingUnit.logDebug('=== Verifying hostingDeployment config ===');
			expect(hostingUnit.config.hostingDeployment).to.exist;
			const hostingDeployment = hostingUnit.config.hostingDeployment!;
			expect(hostingDeployment.artifactRegistry).to.exist;

			// Verify firebase.json was created
			hostingUnit.logDebug('=== Verifying firebase.json exists ===');

			const firebaseJsonPath = resolve(hostingUnit.config.fullPath, 'firebase.json');
			expect(existsSync(firebaseJsonPath)).to.be.true;

			const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
			expect(firebaseJson.hosting).to.exist;

			// Verify .firebaserc was created
			hostingUnit.logDebug('=== Verifying .firebaserc exists ===');
			const firebaseRcPath = resolve(hostingUnit.config.fullPath, '.firebaserc');
			expect(existsSync(firebaseRcPath)).to.be.true;

			// Verify output directory exists with files
			hostingUnit.logDebug('=== Verifying compiled output files ===');
			const htmlPath = resolve(hostingUnit.config.output, 'public/index.html');
			expect(existsSync(htmlPath)).to.be.true;

			// Verify hosting URLs were captured - deployment MUST succeed
			hostingUnit.logDebug('=== Verifying hosting URLs were captured ===');
			expect(hostingUnit.hosting).to.exist;
			expect(Object.keys(hostingUnit.hosting).length).to.be.greaterThan(0);
			
			const hostingUrl = Object.keys(hostingUnit.hosting)[0];
			expect(hostingUrl).to.include('https://');

			// Extract deployment-id from tarball metadata
			hostingUnit.logDebug('=== Extracting deployment-id from tarball metadata ===');
			const deployTempDir = resolve(hostingUnit.config.fullPath, `${CONST_TrashDir}/${CONST_DeployHostingDir}`);
			const metadataPath = resolve(deployTempDir, CONST_DeploymentMetadata);
			expect(existsSync(metadataPath)).to.be.true;
			
			const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
			const deploymentId = metadata[CONST_DeploymentId];
			expect(deploymentId).to.exist;
			hostingUnit.logDebug(`=== Deployment ID from tarball: ${deploymentId} ===`);

			// Verify deployed hosting via HTTP request and check deployment-id matches
			hostingUnit.logDebug('=== Verifying deployed hosting via HTTP request ===');
			const response = await fetch(hostingUrl);
			expect(response.ok).to.be.true;
			const htmlContent = await response.text();
			expect(htmlContent).to.include('Hello World');
			
			// Verify deployment-id in deployed HTML matches tarball metadata
			expect(htmlContent).to.include(`Deployment ID: ${deploymentId}`);
			hostingUnit.logDebug(`=== Deployment ID verified in deployed app: ${deploymentId} ===`);

			hostingUnit.logDebug('=== Deploy Hosting Testing Completed ===');
		}
	})).timeout(300000); // Skip by default - requires Firebase CLI authentication and Artifact Registry

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

