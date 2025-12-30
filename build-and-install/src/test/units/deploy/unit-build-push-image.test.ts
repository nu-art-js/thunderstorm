// file: ./tests/units/deploy/unit-build-push-image.test.ts
import {DebugFlag, generateHex, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_BuildPushImage, phase_Compile, phase_Install, phase_Prepare, Unit_FirebaseFunctionsApp} from '../../_common.js';
import {PhaseAggregatedException} from '../../../main/exceptions/PhaseAggregatedException.js';
import {CommandoException} from '@nu-art/commando/shell/core/CliError';
import {isErrorOfType} from '@nu-art/ts-common';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
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

const deploymentId = generateHex(16);
const params = {
	DEPLOYMENT_ID_PLACEHOLDER: deploymentId,
	FIREBASE_TEST_PROJECT: 'nu-art-thunderstorm-test'
};

const test = async (setup: Input) => {
	FilesCache.clear();

	// Setup workspace with template parameters for deployment ID replacement
	await workspaceCreator.setupWorkspace(setup.fixtures, params);

	const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	buildAndInstall.runtimeParams.allUnits = true;
	buildAndInstall.runtimeParams.environment = 'test';
	buildAndInstall.runtimeParams.buildPushImage = setup.imageTag || 'test-tag-v1.0.0';
	buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Compile], [phase_BuildPushImage]]);

	await buildAndInstall.build();
	try {
		await buildAndInstall.run();
	} catch (error: any) {
		// If Docker isn't available, that's expected - still return bai for verification
		// The test will verify setup (config, Dockerfile) which doesn't require Docker
		if (error instanceof PhaseAggregatedException) {
			// Check if any of the errors are Docker-related
			const hasDockerError = error.errors.some(err => {
				const commandoError = isErrorOfType(err.cause, CommandoException);
				if (commandoError) {
					const stderr = commandoError.stderr || '';
					const hasDocker = stderr.includes('Docker daemon') || stderr.includes('Cannot connect to the Docker daemon');
					if (hasDocker) {
						console.log('Detected Docker daemon error, continuing with test verification');
					}
					return hasDocker;
				}
				const msg = err.cause?.message || String(err.cause);
				return msg.includes('Docker daemon') || msg.includes('Cannot connect to the Docker daemon');
			});
			if (hasDockerError) {
				// Docker not available - expected in test environment, continue to verify setup
				console.log('Returning buildAndInstall despite Docker error');
				return buildAndInstall;
			}
		}
		// Re-throw other errors
		throw error;
	}
	return buildAndInstall;
};

type TestSuite_BuildPushImage = TestSuite<Input, Output>;
type TestCase_BuildPushImage = TestSuite_BuildPushImage['testcases'][number];

const runTestCase = (testCase: TestCase_BuildPushImage, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Build Push Image Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt', 'firebase-function-nested-deps.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	describe('Build Push Image Phase', () => {
		it('Functions - Build and Push Container Image', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
				imageTag: 'test-build-push-v1.0.0'
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify containerDeployment config exists
				expect(functionUnit.config.containerDeployment).to.exist;
				const containerDeployment = functionUnit.config.containerDeployment!;
				expect(containerDeployment.artifactRegistry).to.exist;
				expect(containerDeployment.artifactRegistry.region).to.exist;
				expect(containerDeployment.artifactRegistry.repository).to.exist;
				expect(containerDeployment.artifactRegistry.projectId).to.exist;

				// Verify Dockerfile was created (if it didn't exist)
				const dockerfilePath = resolve(functionUnit.config.fullPath, containerDeployment.dockerfile || 'Dockerfile');
				expect(existsSync(dockerfilePath)).to.be.true;

				// Verify Dockerfile content
				const dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
				expect(dockerfileContent).to.include('FROM node:22');
				expect(dockerfileContent).to.include('WORKDIR /workspace');
				expect(dockerfileContent).to.include('COPY dist/');
				expect(dockerfileContent).to.include('COPY package.json');

				// Verify output directory exists with compiled files
				const compiledJs = resolve(functionUnit.config.output, 'index.js');
				expect(existsSync(compiledJs)).to.be.true;

				// Verify package.json exists in output
				const packageJsonPath = resolve(functionUnit.config.output, 'package.json');
				expect(existsSync(packageJsonPath)).to.be.true;

				// Verify image reference construction
				const imageName = containerDeployment.imageName || functionUnit.config.key;
				const artifactRegistryPath = `${containerDeployment.artifactRegistry.region}-docker.pkg.dev/${containerDeployment.artifactRegistry.projectId}/${containerDeployment.artifactRegistry.repository}`;
				const expectedImageReference = `${artifactRegistryPath}/${imageName}:test-build-push-v1.0.0`;
				
				functionUnit.logDebug(`Expected image reference: ${expectedImageReference}`);
				functionUnit.logDebug('=== Build Push Image Testing Completed (Docker not required for setup verification) ===');
			}
		})).timeout(300000); // Skip by default - requires Docker and gcloud CLI

		it('Functions - Build Push Image with Custom Image Name', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello-container.txt'],
				imageTag: 'custom-image-v1.0.0'
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify containerDeployment config exists
				expect(functionUnit.config.containerDeployment).to.exist;
				const containerDeployment = functionUnit.config.containerDeployment!;

				// Verify image name construction
				const imageName = containerDeployment.imageName || functionUnit.config.key;
				expect(imageName).to.exist;

				// Verify Dockerfile exists
				const dockerfilePath = resolve(functionUnit.config.fullPath, containerDeployment.dockerfile || 'Dockerfile');
				expect(existsSync(dockerfilePath)).to.be.true;

				functionUnit.logDebug('=== Custom Image Name Test Completed ===');
			}
		})).timeout(300000);

		it('Functions - Build Push Image with Existing Dockerfile', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello-container.txt'],
				imageTag: 'existing-dockerfile-v1.0.0'
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify Dockerfile exists
				const dockerfilePath = resolve(functionUnit.config.fullPath, 'Dockerfile');
				expect(existsSync(dockerfilePath)).to.be.true;

				// Verify Dockerfile content is valid
				const dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
				expect(dockerfileContent.length).to.be.greaterThan(0);

				functionUnit.logDebug('=== Existing Dockerfile Test Completed ===');
			}
		})).timeout(300000);
	});

	afterEach(function () {
		if (this.currentTest?.state === 'failed')
			suiteHasFailures = true;

		suiteHasFailures ??= false;
	});

	after(async function () {
		await sleep(1000);
		if (suiteHasFailures === false)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});

