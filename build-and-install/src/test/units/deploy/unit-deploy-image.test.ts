// file: ./tests/units/deploy/unit-deploy-image.test.ts
import {DebugFlag, generateHex, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_BuildPushImage, phase_Compile, phase_DeployImage, phase_Install, phase_Prepare, Unit_FirebaseFunctionsApp} from '../../_common.js';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../main/config/consts.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);
DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(dirname, './temp-deploy-image');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

type Input = {
	fixtures: string[];
	imageTag?: string;
	skipDeploy?: boolean;
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
	const imageTag = setup.imageTag || 'test-deploy-v1.0.0';
	buildAndInstall.runtimeParams.buildPushImage = imageTag;
	buildAndInstall.runtimeParams.deployImage = imageTag;
	buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Compile], [phase_BuildPushImage], [phase_DeployImage]]);

	await buildAndInstall.build();
	await buildAndInstall.run();
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

	describe('Deploy Image Phase', () => {
		it('Functions - Deploy Container Image to Firebase', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello-container.txt'],
				imageTag: 'test-deploy-image-v1.0.0',
				skipDeploy: false
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify containerDeployment config exists
				expect(functionUnit.config.containerDeployment).to.exist;
				const containerDeployment = functionUnit.config.containerDeployment!;
				expect(containerDeployment.artifactRegistry).to.exist;

				// Verify firebase.json was created with container image format
				const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.functions).to.exist;
				
				// Verify container image format (source should be the image reference, not a path)
				expect(firebaseJson.functions.source).to.exist;
				const imageName = containerDeployment.imageName || functionUnit.config.key;
				const artifactRegistryPath = `${containerDeployment.artifactRegistry.region}-docker.pkg.dev/${containerDeployment.artifactRegistry.projectId}/${containerDeployment.artifactRegistry.repository}`;
				const expectedImageReference = `${artifactRegistryPath}/${imageName}:test-deploy-image-v1.0.0`;
				expect(firebaseJson.functions.source).to.equal(expectedImageReference);
				
				// Verify runtime is not set (container images don't need runtime)
				expect(firebaseJson.functions.runtime).to.be.undefined;

				// Verify .firebaserc was created
				const firebaseRcPath = resolve(functionUnit.config.fullPath, CONST_FirebaseRC);
				expect(existsSync(firebaseRcPath)).to.be.true;

				// Verify output directory exists with files
				const compiledJs = resolve(functionUnit.config.output, 'index.js');
				expect(existsSync(compiledJs)).to.be.true;

				// Verify function URLs were captured (if deployment succeeded)
				expect(functionUnit.functions).to.exist;
				if (Object.keys(functionUnit.functions).length > 0) {
					const functionName = Object.keys(functionUnit.functions)[0];
					expect(functionUnit.functions[functionName]).to.include('https://');
				}

				functionUnit.logDebug('=== Deploy Image Testing Completed ===');
			}
		})).timeout(300000); // Skip by default - requires Firebase CLI authentication and Docker

		it('Functions - Deploy Image with Custom Image Name', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello-container.txt'],
				imageTag: 'custom-deploy-v1.0.0',
				skipDeploy: false
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify containerDeployment config exists
				expect(functionUnit.config.containerDeployment).to.exist;
				// const containerDeployment = functionUnit.config.containerDeployment!;

				// Verify firebase.json uses container image format
				const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.functions.source).to.exist;
				
				// Verify image reference contains the correct tag
				expect(firebaseJson.functions.source).to.include('custom-deploy-v1.0.0');

				functionUnit.logDebug('=== Custom Image Name Deploy Test Completed ===');
			}
		})).timeout(300000);

		it('Functions - Verify Container Image Format in firebase.json', runTestCase({
			input: {
				fixtures: ['./workspace-deploy.txt', './firebase-function-hello-container.txt'],
				imageTag: 'format-test-v1.0.0',
				skipDeploy: true
			},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify firebase.json was created
				const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.functions).to.exist;

				// Verify container image format
				expect(firebaseJson.functions.source).to.exist;
				// Container image format should be: region-docker.pkg.dev/project/repo/image:tag
				expect(firebaseJson.functions.source).to.match(/^[a-z0-9-]+-docker\.pkg\.dev\/[^/]+\/[^/]+\/[^:]+:[^:]+$/);
				
				// Verify no runtime field (containers don't use runtime)
				expect(firebaseJson.functions.runtime).to.be.undefined;

				functionUnit.logDebug('=== Container Image Format Test Completed ===');
			}
		})).timeout(300000);
	});

	describe('Deployment Verification', () => {
		it('Functions - Verify deployed container endpoint returns expected content', async function () {
			this.skip(); // Skip by default - requires actual deployment
			// This test would make an HTTP request to the deployed function
			// const response = await fetch('https://<region>-FIREBASE_TEST_PROJECT.cloudfunctions.net/hello');
			// const data = await response.json();
			// expect(data.message).to.equal('Hello World');
			// expect(data.deploymentId).to.exist;
		});
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

