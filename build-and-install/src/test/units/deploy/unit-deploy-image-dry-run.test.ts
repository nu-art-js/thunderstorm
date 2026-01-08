// file: ./tests/units/deploy/unit-deploy-image-dry-run.test.ts
import {DebugFlag, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Compile, phase_DeployImage, phase_Prepare, Unit_FirebaseFunctionsApp} from '../../_common.js';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_FirebaseJSON} from '../../../main/config/consts.js';
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
	const imageTag = setup.imageTag || 'latest';
	buildAndInstall.runtimeParams.deployImage = imageTag;
	buildAndInstall.runtimeParams.dryRun = setup.useDryRun || false;
	if (setup.deployFunction) {
		buildAndInstall.runtimeParams.deployFunction = setup.deployFunction;
	}
	if (setup.deleteFunction) {
		buildAndInstall.runtimeParams.deleteFunction = setup.deleteFunction;
	}
	if (setup.deleteFunctions !== undefined) {
		buildAndInstall.runtimeParams.deleteFunctions = setup.deleteFunctions;
	}

	buildAndInstall.setPhases([[phase_Prepare]]);
	await buildAndInstall.build();
	await buildAndInstall.run();

	buildAndInstall.setPhases([[phase_Compile], [phase_DeployImage]]);
	await buildAndInstall.build();
	await buildAndInstall.run();

	return buildAndInstall;
};

type TestSuite_DeployImageDryRun = TestSuite<Input, Output>;
type TestCase_DeployImageDryRun = TestSuite_DeployImageDryRun['testcases'][number];

const runTestCase = (testCase: TestCase_DeployImageDryRun, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Deploy Image Phase - Dry Run', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt', 'firebase-function-nested-deps.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	it('Functions - Verify Container Image Format in firebase.json', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: 'latest',
			useDryRun: true
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>('firebase-function-hello', Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify firebase.json was created
			functionUnit.logDebug('=== Verifying firebase.json exists ===');
			const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
			expect(existsSync(firebaseJsonPath)).to.be.true;

			const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
			functionUnit.logDebug('=== Verifying firebase.json functions configuration ===');
			expect(firebaseJson.functions).to.exist;

			// Verify source points to dist directory (not image reference)
			// Container image is specified via --docker-image flag in gcloud deploy, not in firebase.json
			functionUnit.logDebug('=== Verifying firebase.json source configuration ===');
			expect(firebaseJson.functions.source).to.exist;
			expect(firebaseJson.functions.source).to.equal('dist');

			// Verify no runtime field (containers don't use runtime)
			// Runtime should not exist in the object for container deployment
			functionUnit.logDebug('=== Verifying runtime is not set for container deployment ===');
			if (firebaseJson.functions.hasOwnProperty('runtime')) {
				// If runtime exists, it should be undefined or not set for container deployment
				expect(firebaseJson.functions.runtime).to.be.undefined;
			}

			functionUnit.logDebug('=== Container Image Format Test Completed ===');
		}
	})).timeout(300000);

	it('Functions - Deploy Single Function', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: 'latest',
			useDryRun: true,
			deployFunction: 'hello',
			deleteFunction: 'hello' // Delete function before deploying to ensure fresh deployment
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>('firebase-function-hello', Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify functions config exists and includes the expected function
			functionUnit.logDebug('=== Verifying functions config exists and includes hello ===');
			expect(functionUnit.config.functions).to.exist;
			expect(Array.isArray(functionUnit.config.functions)).to.be.true;
			expect(functionUnit.config.functions.length).to.be.greaterThan(0);
			expect(functionUnit.config.functions).to.include('hello');

			// Verify firebase.json was created
			functionUnit.logDebug('=== Verifying firebase.json exists ===');
			const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
			expect(existsSync(firebaseJsonPath)).to.be.true;

			functionUnit.logDebug('=== Deploy Single Function Test Completed ===');
		}
	})).timeout(300000);

	it('Functions - Deploy All Functions', runTestCase({
		input: {
			fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'],
			imageTag: 'latest',
			useDryRun: true,
			deleteFunctions: true // Delete all functions before deploying to ensure fresh deployment
		},
		result: async (bai: BuildAndInstall) => {
			const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>('firebase-function-hello', Unit_FirebaseFunctionsApp);
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify functions config exists
			functionUnit.logDebug('=== Verifying functions config exists ===');
			expect(functionUnit.config.functions).to.exist;
			expect(functionUnit.config.functions.length).to.be.greaterThan(0);

			// Verify firebase.json was created
			functionUnit.logDebug('=== Verifying firebase.json exists ===');
			const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
			expect(existsSync(firebaseJsonPath)).to.be.true;

			functionUnit.logDebug('=== Deploy All Functions Test Completed ===');
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

