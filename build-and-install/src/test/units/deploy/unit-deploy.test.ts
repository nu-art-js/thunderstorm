// file: ./tests/units/deploy/unit-deploy.test.ts
import {DebugFlag, generateHex, LogLevel, sleep} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Compile, phase_Deploy, phase_Install, phase_Prepare, Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../../_common.js';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../main/core/consts.js';
import {FilesCache} from '../../../main/v3/core/FilesCache.js';
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
	buildAndInstall.runtimeParams.deploy = true;
	buildAndInstall.setPhases([[phase_Prepare], [phase_Deploy]]);

	await buildAndInstall.build();
	await buildAndInstall.run();
	return buildAndInstall;
};


type TestSuite_Deploy = TestSuite<Input, Output>;
type TestCase_Deploy = TestSuite_Deploy['testcases'][number];

const runTestCase = (testCase: TestCase_Deploy, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Firebase Deploy Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(60000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt', 'firebase-function-nested-deps.txt'], params);
		await workspaceCreator.setupWorkspace(['workspace-deploy.txt'], params);
	});

	describe('Deploy Phase', () => {
		it('Functions - Deploy to Firebase', runTestCase({
			input: {fixtures: ['./workspace-deploy.txt', './firebase-function-hello.txt'], skipDeploy: false},
			result: async (bai: BuildAndInstall) => {
				const functionUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-function-hello') as Unit_FirebaseFunctionsApp;
				expect(functionUnit).to.exist;

				// Verify firebase.json was created
				const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.functions).to.exist;
				expect(firebaseJson.functions.source).to.equal('dist');

				// Verify .firebaserc was created
				const firebaseRcPath = resolve(functionUnit.config.fullPath, CONST_FirebaseRC);
				expect(existsSync(firebaseRcPath)).to.be.true;

				// Verify output directory exists with files
				const compiledJs = resolve(functionUnit.config.output, 'index.js');
				expect(existsSync(compiledJs)).to.be.true;

				// Verify function URLs were captured
				expect(functionUnit.functions).to.exist;
				expect(functionUnit.functions['hello']).to.exist;
				expect(functionUnit.functions['hello']).to.include('https://');

				// Verify deployed endpoint returns expected content
				const functionUrl = functionUnit.functions['hello'];
				const response = await fetch(functionUrl);
				expect(response.ok).to.be.true;

				const data = await response.json();
				expect(data.message).to.equal('Hello World');
				expect(data.deploymentId).to.exist;
				expect(data.deploymentId).to.equal(deploymentId);
				functionUnit.logDebug('=== Deploy Function Testing Completed ===');
			}
		})).timeout(300000); // Skip by default - requires Firebase CLI authentication

		it('Hosting - Deploy to Firebase', runTestCase({
			input: {fixtures: ['./workspace-deploy.txt', './firebase-hosting-hello.txt'], skipDeploy: false},
			result: async (bai: BuildAndInstall) => {
				const hostingUnit = bai.projectUnits.find(unit => unit.config.key === 'firebase-hosting-hello') as Unit_FirebaseHostingApp;

				expect(hostingUnit).to.exist;

				// Verify firebase.json was created
				const firebaseJsonPath = resolve(hostingUnit.config.fullPath, CONST_FirebaseJSON);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.hosting).to.exist;
				expect(firebaseJson.hosting.public).to.equal('dist/public');

				// Verify .firebaserc was created
				const firebaseRcPath = resolve(hostingUnit.config.fullPath, CONST_FirebaseRC);
				expect(existsSync(firebaseRcPath)).to.be.true;

				// Verify output directory exists with files
				const htmlPath = resolve(hostingUnit.config.output, 'public/index.html');
				expect(existsSync(htmlPath)).to.be.true;

				// Deployment should complete without errors
				// The deploy method will throw if it fails
			}
		})).timeout(300000); // Skip by default - requires Firebase CLI authentication

		it('Functions - Nested Dependencies - All transitive dependencies in package.json', async () => {
			FilesCache.clear();
			await workspaceCreator.setupWorkspace(['./workspace-deploy.txt', './firebase-function-nested-deps.txt'], params);

			const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
			buildAndInstall.runtimeParams.allUnits = true;
			buildAndInstall.runtimeParams.environment = 'test';
			// Use compile phase instead of deploy to test package.json generation
			buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Compile]]);

			await buildAndInstall.build();
			await buildAndInstall.run();

			const functionUnit = buildAndInstall.projectUnits.find(unit => unit.config.key === 'firebase-function-nested-deps') as Unit_FirebaseFunctionsApp;
			expect(functionUnit).to.exist;

			// Verify output directory exists
			const distPackageJsonPath = resolve(functionUnit.config.output, 'package.json');
			expect(existsSync(distPackageJsonPath)).to.be.true;

			// Read and parse the generated package.json
			const distPackageJson = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'));
			expect(distPackageJson.dependencies).to.exist;

			// Verify all transitive dependencies are included
			// Direct dependency: @test/lib-a
			expect(distPackageJson.dependencies['@test/lib-a']).to.exist;
			expect(distPackageJson.dependencies['@test/lib-a']).to.equal('file:.dependencies/@test/lib-a');

			// Transitive dependency: @test/lib-b (dependency of @test/lib-a)
			expect(distPackageJson.dependencies['@test/lib-b']).to.exist;
			expect(distPackageJson.dependencies['@test/lib-b']).to.equal('file:.dependencies/@test/lib-b');

			// External dependency: firebase-functions
			expect(distPackageJson.dependencies['firebase-functions']).to.exist;

			// Verify .dependencies folder structure exists
			const dependenciesDir = resolve(functionUnit.config.output, '.dependencies');
			expect(existsSync(dependenciesDir)).to.be.true;

			const libADir = resolve(dependenciesDir, '@test/lib-a');
			expect(existsSync(libADir)).to.be.true;

			const libBDir = resolve(dependenciesDir, '@test/lib-b');
			expect(existsSync(libBDir)).to.be.true;

			// Verify nested package.json files exist
			const libAPackageJson = resolve(libADir, 'package.json');
			expect(existsSync(libAPackageJson)).to.be.true;

			const libBPackageJson = resolve(libBDir, 'package.json');
			expect(existsSync(libBPackageJson)).to.be.true;

			// Verify nested package.json has correct structure
			const libAPackage = JSON.parse(readFileSync(libAPackageJson, 'utf-8'));
			expect(libAPackage.name).to.equal('@test/lib-a');

			const libBPackage = JSON.parse(readFileSync(libBPackageJson, 'utf-8'));
			expect(libBPackage.name).to.equal('@test/lib-b');

			functionUnit.logDebug('=== Nested Dependencies Test Completed ===');
		}).timeout(300000);
	});

	describe('Deployment Verification', () => {
		it('Functions - Verify deployed endpoint returns expected content', async function () {
			this.skip(); // Skip by default - requires actual deployment
			// This test would make an HTTP request to the deployed function
			// const response = await fetch('https://<region>-FIREBASE_TEST_PROJECT.cloudfunctions.net/hello');
			// const data = await response.json();
			// expect(data.message).to.equal('Hello World');
			// expect(data.deploymentId).to.exist;
		});

		it('Hosting - Verify deployed site returns expected content', async function () {
			this.skip(); // Skip by default - requires actual deployment
			// This test would make an HTTP request to the deployed hosting
			// const response = await fetch('https://FIREBASE_TEST_PROJECT.web.app/');
			// const html = await response.text();
			// expect(html).to.include('Hello World');
			// expect(html).to.include('Deployment ID:');
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

