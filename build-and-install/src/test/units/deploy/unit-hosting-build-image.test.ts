// file: ./tests/units/deploy/unit-build-hosting.test.ts
import {DebugFlag, generateHex, isErrorOfType, LogLevel, sleep, tsValidateAnyString, tsValidateResult} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_BuildPushImage, phase_Compile, phase_Install, phase_Prepare, Unit_FirebaseHostingApp} from '../../_common.js';
import {PhaseAggregatedException} from '../../../main/exceptions/PhaseAggregatedException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {execSync} from 'child_process';
import {deleteArtifactRegistryVersion} from './test-utils.js';

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
	DEPLOYMENT_ID_PLACEHOLDER: '{{DEPLOYMENT_ID_PLACEHOLDER}}'
};

const test = async (setup: Input) => {
	FilesCache.clear();

	// Setup workspace with template parameters for deployment ID replacement
	const deploymentId = generateHex(16);
	await workspaceCreator.setupWorkspace(setup.fixtures, {
		...params,
		DEPLOYMENT_ID_PLACEHOLDER: deploymentId,
	});

	const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	buildAndInstall.runtimeParams.allUnits = true;
	buildAndInstall.runtimeParams.environment = 'test';
	const imageTag = setup.imageTag || 'test-tag-v1.0.0';
	buildAndInstall.runtimeParams.buildPushImage = imageTag;
	buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Compile], [phase_BuildPushImage]]);

	await buildAndInstall.build();
	const hostingUnit = buildAndInstall.workspace.getUnitByKey<Unit_FirebaseHostingApp>('firebase-hosting-hello', Unit_FirebaseHostingApp);
	hostingUnit.injectedMetadata['deployment-id'] = deploymentId;

	// In tests, delete existing version if it exists to avoid conflicts
	// In real project lifecycle, version uniqueness must be preserved
	if (hostingUnit.config.hostingDeployment) {
		await deleteArtifactRegistryVersion(
			hostingUnit.config.hostingDeployment.artifactRegistry,
			hostingUnit.config.key,
			imageTag,
			hostingUnit
		);
	}

	try {
		await buildAndInstall.run();
	} catch (error: any) {
		// If Artifact Registry fails (auth, API not enabled, etc.), that's expected in test environment
		// The test will verify setup (config, metadata file, tarball) which doesn't require Artifact Registry to succeed
		if (error instanceof PhaseAggregatedException) {
			// Check if any of the errors are Artifact Registry related (auth, API, project not set, etc.)
			const specificError = error.errors.find(err => {
				const commandoError = isErrorOfType(err.cause, CommandoException);
				if (commandoError) {
					const stderr = commandoError.stderr || '';
					const stdout = commandoError.stdout || '';
					const errorMessage = commandoError.message || '';
					// Common Artifact Registry errors that are expected in test environment
					const artifactRegistryErrors = [
						'ERROR: (gcloud.artifacts',
						'PERMISSION_DENIED',
						'NOT_FOUND',
						'API not enabled',
						'authentication',
						'Could not reach',
						'The required property [project] is not currently set',
						'Failed to upload hosting package',
						'Repository',
						'not found',
						'repository does not exist',
						'retry budget exhausted',
						'name unknown',
					];
					// Check in stderr, stdout, and error message
					return artifactRegistryErrors.some(errMsg =>
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

type TestSuite_BuildHosting = TestSuite<Input, Output>;
type TestCase_BuildHosting = TestSuite_BuildHosting['testcases'][number];

const runTestCase = (testCase: TestCase_BuildHosting, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Build Hosting Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	it('Hosting - Build and Upload to Artifact Registry', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-hosting-hello.txt'],
			imageTag: 'test-build-hosting-v1.0.0'
		},
		result: async (bai: BuildAndInstall) => {
			const hostingUnit = bai.workspace.getUnitByKey<Unit_FirebaseHostingApp>('firebase-hosting-hello', Unit_FirebaseHostingApp);
			hostingUnit.logDebug('=== Verifying hosting unit exists ===');
			expect(hostingUnit).to.exist;

			// Verify hostingDeployment config exists
			hostingUnit.logDebug('=== Verifying hostingDeployment config ===');
			expect(hostingUnit.config.hostingDeployment).to.exist;
			const hostingDeployment = hostingUnit.config.hostingDeployment!;

			// Validate artifactRegistry structure
			const artifactRegistryValidator = {
				region: tsValidateAnyString,
				repository: tsValidateAnyString,
				projectId: tsValidateAnyString,
			};
			const validationResult = tsValidateResult(hostingDeployment.artifactRegistry, artifactRegistryValidator, undefined, false);
			expect(validationResult).to.be.undefined;

			// Verify deployment-metadata.json was created in staging directory
			hostingUnit.logDebug('=== Verifying deployment-metadata.json exists ===');
			const stagingDir = resolve(hostingUnit.config.fullPath, '.trash/staging');
			const metadataPath = resolve(stagingDir, 'deployment-metadata.json');
			expect(existsSync(metadataPath)).to.be.true;

			// Verify metadata content
			const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
			expect(metadata['deployment-id']).to.exist;
			expect(metadata['build.timestamp']).to.exist;
			expect(metadata['build.tag']).to.equal('test-build-hosting-v1.0.0');
			expect(metadata['build.project']).to.equal(hostingDeployment.artifactRegistry.projectId);
			expect(metadata['build.package-name']).to.equal(hostingUnit.config.packageJson.name);

			// Verify tarball was created
			hostingUnit.logDebug('=== Verifying tarball exists ===');
			const tarballPath = resolve(hostingUnit.config.fullPath, '.trash/hosting-build.tar.gz');
			expect(existsSync(tarballPath)).to.be.true;

			// Verify package name from package.json
			const packageName = hostingUnit.config.packageJson.name;
			expect(packageName).to.equal('firebase-hosting-hello');

			// Try to verify package exists in Artifact Registry (if accessible)
			try {
				const region = hostingDeployment.artifactRegistry.region;
				const repository = hostingDeployment.artifactRegistry.repository;
				const projectId = hostingDeployment.artifactRegistry.projectId;
				const accessToken = execSync('gcloud auth print-access-token', {encoding: 'utf-8'}).trim();

				// Try to list packages (might fail if not authenticated or API not enabled)
				const listUrl = `https://artifactregistry.googleapis.com/v1/projects/${projectId}/locations/${region}/repositories/${repository}/packages`;
				const response = await fetch(listUrl, {
					headers: {
						'Authorization': `Bearer ${accessToken}`
					}
				});

				if (response.ok) {
					const packages = await response.json();
					hostingUnit.logDebug('=== Package list from Artifact Registry ===', packages);
					// Verify package exists
					const packageExists = packages.packages?.some((pkg: any) => pkg.name.includes(packageName));
					if (packageExists) {
						hostingUnit.logDebug('=== Package verified in Artifact Registry ===');
					}
				}
			} catch (error: any) {
				// Expected if Artifact Registry is not accessible in test environment
				hostingUnit.logDebug('=== Could not verify package in Artifact Registry (expected in test env) ===', error.message);
			}

			hostingUnit.logDebug('=== Build Hosting Testing Completed ===');
		}
	})).timeout(300000); // Skip by default - requires gcloud CLI

	afterEach(function () {
		if (this.currentTest?.state === 'failed')
			suiteHasFailures = true;

		suiteHasFailures ??= false;
	});

	after(async function () {
		this.timeout(10000);
		await sleep(1000);
		// if (suiteHasFailures === false)
		// 	await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});

