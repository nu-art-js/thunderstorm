// file: ./tests/units/deploy/unit-deploy.test.ts
import {DebugFlag, generateHex, LogLevel, sleep} from '@nu-art/ts-common';
import {defaultTestProcessor, runSingleTestCase, TestModel} from '@nu-art/testalot';
import {phase_Compile, phase_Deploy, phase_Install, phase_Prepare, Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp} from '../../_common.js';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_FirebaseJSON, CONST_FirebaseRC} from '../../../main/config/consts.js';
import {CONST_TestFixture_FunctionHello, CONST_TestFixture_HostingHello} from './test-consts.js';
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
	buildAndInstall.runtimeParams.verbose = true;
	buildAndInstall.setPhases([[phase_Prepare], [phase_Install], [phase_Deploy]]);

	await buildAndInstall.build();
	await buildAndInstall.run();
	return buildAndInstall;
};


type TestCase_Deploy = TestModel<Input, Output>;

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
				const functionUnit = bai.workspace.getUnitByKey<Unit_FirebaseFunctionsApp>(CONST_TestFixture_FunctionHello, Unit_FirebaseFunctionsApp);
				functionUnit.logDebug('=== Verifying function unit exists ===');
				expect(functionUnit).to.exist;

				// Verify firebase.json was created
				const firebaseJsonPath = resolve(functionUnit.config.fullPath, CONST_FirebaseJSON);
				functionUnit.logDebug(`=== Verifying firebase.json exists at: ${firebaseJsonPath} ===`);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				functionUnit.logDebug('=== Verifying firebase.json structure ===');
				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.functions).to.exist;
				expect(firebaseJson.functions.source).to.equal('dist');
				functionUnit.logDebug(`firebase.json functions.source: ${firebaseJson.functions.source}`);

				// Verify .firebaserc was created
				const firebaseRcPath = resolve(functionUnit.config.fullPath, CONST_FirebaseRC);
				functionUnit.logDebug(`=== Verifying .firebaserc exists at: ${firebaseRcPath} ===`);
				expect(existsSync(firebaseRcPath)).to.be.true;

				// Verify output directory exists with files
				const compiledJs = resolve(functionUnit.config.output, 'index.js');
				functionUnit.logDebug(`=== Verifying compiled JS exists at: ${compiledJs} ===`);
				expect(existsSync(compiledJs)).to.be.true;

				// Verify function URLs were captured
				functionUnit.logDebug('=== Verifying function URLs were captured ===');
				expect(functionUnit.functions).to.exist;
				expect(functionUnit.functions['hello']).to.exist;
				expect(functionUnit.functions['hello']).to.include('https://');
				functionUnit.logDebug(`Function URL: ${functionUnit.functions['hello']}`);

				// Verify deployed endpoint returns expected content
				const functionUrl = functionUnit.functions['hello'];
				functionUnit.logDebug(`=== Fetching deployed endpoint: ${functionUrl} ===`);
				const response = await fetch(functionUrl);
				expect(response.ok).to.be.true;
				functionUnit.logDebug(`Response status: ${response.status} ${response.statusText}`);

				functionUnit.logDebug('=== Verifying response content ===');
				const data = await response.json();
				expect(data.message).to.equal('Hello World');
				expect(data.deploymentId).to.exist;
				expect(data.deploymentId).to.equal(deploymentId);
				functionUnit.logDebug(`Response message: ${data.message}, deploymentId: ${data.deploymentId}`);
				functionUnit.logDebug('=== Deploy Function Testing Completed ===');
			}
		})).timeout(300000); // Skip by default - requires Firebase CLI authentication

		it('Hosting - Deploy to Firebase', runTestCase({
			input: {fixtures: ['./workspace-deploy.txt', './firebase-hosting-hello.txt'], skipDeploy: false},
			result: async (bai: BuildAndInstall) => {
				const hostingUnit = bai.workspace.getUnitByKey<Unit_FirebaseHostingApp>(CONST_TestFixture_HostingHello, Unit_FirebaseHostingApp);
				hostingUnit.logDebug('=== Verifying hosting unit exists ===');
				expect(hostingUnit).to.exist;

				// Verify firebase.json was created
				const firebaseJsonPath = resolve(hostingUnit.config.fullPath, CONST_FirebaseJSON);
				hostingUnit.logDebug(`=== Verifying firebase.json exists at: ${firebaseJsonPath} ===`);
				expect(existsSync(firebaseJsonPath)).to.be.true;

				hostingUnit.logDebug('=== Verifying firebase.json structure ===');
				const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));
				expect(firebaseJson.hosting).to.exist;
				expect(firebaseJson.hosting.public).to.equal('dist/public');
				hostingUnit.logDebug(`firebase.json hosting.public: ${firebaseJson.hosting.public}`);

				// Verify .firebaserc was created
				const firebaseRcPath = resolve(hostingUnit.config.fullPath, CONST_FirebaseRC);
				hostingUnit.logDebug(`=== Verifying .firebaserc exists at: ${firebaseRcPath} ===`);
				expect(existsSync(firebaseRcPath)).to.be.true;

				// Verify output directory exists with files
				const htmlPath = resolve(hostingUnit.config.output, 'public/index.html');
				hostingUnit.logDebug(`=== Verifying HTML output exists at: ${htmlPath} ===`);
				expect(existsSync(htmlPath)).to.be.true;

				// Deployment should complete without errors
				// The deploy method will throw if it fails
				hostingUnit.logDebug('=== Hosting deployment completed successfully ===');
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
			functionUnit.logDebug('=== Verifying function unit exists ===');
			expect(functionUnit).to.exist;

			// Verify output directory exists
			const distPackageJsonPath = resolve(functionUnit.config.output, 'package.json');
			functionUnit.logDebug(`=== Verifying dist package.json exists at: ${distPackageJsonPath} ===`);
			expect(existsSync(distPackageJsonPath)).to.be.true;

			// Read and parse the generated package.json
			functionUnit.logDebug('=== Reading and verifying dist package.json structure ===');
			const distPackageJson = JSON.parse(readFileSync(distPackageJsonPath, 'utf-8'));
			expect(distPackageJson.dependencies).to.exist;

			// Verify all transitive dependencies are included
			// Direct dependency: @test/lib-a
			functionUnit.logDebug('=== Verifying direct dependency @test/lib-a ===');
			expect(distPackageJson.dependencies['@test/lib-a']).to.exist;
			expect(distPackageJson.dependencies['@test/lib-a']).to.equal('file:.dependencies/@test/lib-a');
			functionUnit.logDebug(`@test/lib-a: ${distPackageJson.dependencies['@test/lib-a']}`);

			// Transitive dependency: @test/lib-b (dependency of @test/lib-a)
			functionUnit.logDebug('=== Verifying transitive dependency @test/lib-b ===');
			expect(distPackageJson.dependencies['@test/lib-b']).to.exist;
			expect(distPackageJson.dependencies['@test/lib-b']).to.equal('file:.dependencies/@test/lib-b');
			functionUnit.logDebug(`@test/lib-b: ${distPackageJson.dependencies['@test/lib-b']}`);

			// External dependency: firebase-functions
			functionUnit.logDebug('=== Verifying external dependency firebase-functions ===');
			expect(distPackageJson.dependencies['firebase-functions']).to.exist;
			functionUnit.logDebug(`firebase-functions: ${distPackageJson.dependencies['firebase-functions']}`);

			// Verify .dependencies folder structure exists
			const dependenciesDir = resolve(functionUnit.config.output, '.dependencies');
			functionUnit.logDebug(`=== Verifying .dependencies directory exists at: ${dependenciesDir} ===`);
			expect(existsSync(dependenciesDir)).to.be.true;

			const libADir = resolve(dependenciesDir, '@test/lib-a');
			functionUnit.logDebug(`=== Verifying @test/lib-a directory exists at: ${libADir} ===`);
			expect(existsSync(libADir)).to.be.true;

			const libBDir = resolve(dependenciesDir, '@test/lib-b');
			functionUnit.logDebug(`=== Verifying @test/lib-b directory exists at: ${libBDir} ===`);
			expect(existsSync(libBDir)).to.be.true;

			// Verify nested package.json files exist
			const libAPackageJson = resolve(libADir, 'package.json');
			functionUnit.logDebug(`=== Verifying @test/lib-a package.json exists at: ${libAPackageJson} ===`);
			expect(existsSync(libAPackageJson)).to.be.true;

			const libBPackageJson = resolve(libBDir, 'package.json');
			functionUnit.logDebug(`=== Verifying @test/lib-b package.json exists at: ${libBPackageJson} ===`);
			expect(existsSync(libBPackageJson)).to.be.true;

			// Verify nested package.json has correct structure
			functionUnit.logDebug('=== Verifying nested package.json structure ===');
			const libAPackage = JSON.parse(readFileSync(libAPackageJson, 'utf-8'));
			expect(libAPackage.name).to.equal('@test/lib-a');
			functionUnit.logDebug(`@test/lib-a package name: ${libAPackage.name}`);

			const libBPackage = JSON.parse(readFileSync(libBPackageJson, 'utf-8'));
			expect(libBPackage.name).to.equal('@test/lib-b');
			functionUnit.logDebug(`@test/lib-b package name: ${libBPackage.name}`);

			functionUnit.logDebug('=== Nested Dependencies Test Completed ===');
		}).timeout(300000);
	});

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

