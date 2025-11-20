import {AsyncVoidFunction, generateHex, Module, ModuleManager, RecursiveObjectOfPrimitives} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase-backend';
import {RouteResolver_Dummy} from '../modules/server/route-resolvers/RouteResolver_Dummy.js';
import {Storm} from '../core/Storm.js';
import {ModuleBE_Auth} from '@nu-art/google-services-backend';
import {dispatcher_resetTests} from '@nu-art/ts-common/testing/consts';
import {TestModel} from '@nu-art/ts-common/testing/types';

type StormTestConfig = {
	databaseName?: string,
	modules: Module[],
	config: RecursiveObjectOfPrimitives
};

export type StormTestInput = {
	modules: Module[];
	config?: RecursiveObjectOfPrimitives
	cleanup?: AsyncVoidFunction
	before?: AsyncVoidFunction
	after?: AsyncVoidFunction
};


export class StormTest {

	private firebaseConfig;
	private testConfig;

	constructor(config: StormTestConfig) {
		this.testConfig = config;
		const database = config.databaseName ?? `demo-test`;
		this.firebaseConfig = {
			project_id: generateHex(4),
			databaseURL: `http://localhost:8102/?ns=${database}`,
			isEmulator: true
		};

		process.env.FUNCTIONS_EMULATOR = 'true';
		process.env.GCLOUD_PROJECT = database;
		ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: this.firebaseConfig}});
	}

	async init() {
		new Storm({envKey: 'local', pathToDefaultConfig: '_config/default', pathToEnvOverrideConfig: '_config/test'})
			.addModulePack(this.testConfig.modules)
			.setConfig({...this.testConfig.config, isDebug: true,})
			.setInitialRouteResolver(new RouteResolver_Dummy())
			.init();

		return this;
	}

	async cleanup() {
		await dispatcher_resetTests.dispatchModuleAsync();
		// @ts-ignore
		ModuleManager.__resetForTests();
	}
}


export const stormTester = async <TestCase extends TestModel<any, any>>(stormTestInput: StormTestInput, testCaseRunner: () => Promise<void>) => {
	const stormTest = new StormTest({modules: stormTestInput.modules, config: stormTestInput.config ?? {}});
	await stormTest.init();
	try {
		await stormTestInput.before?.();
		await testCaseRunner();
	} finally {
		// first we do all the applicative test cleanups, for example, delete firestore collections
		await stormTestInput.after?.();

		// only then we clean infra stuff, like firebase apps
		await stormTest.cleanup();
	}
};

