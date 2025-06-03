import {generateHex, Module, ModuleManager, TS_Object} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase/backend';
import {RouteResolver_Dummy} from '../modules/server/route-resolvers/RouteResolver_Dummy';
import {Storm} from '../core/Storm';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs';

type StormTestConfig = { databaseName?: string, modules: Module[], config: TS_Object };

export class StormTest {

	private firebaseConfig;
	private testConfig;

	constructor(config: StormTestConfig) {
		this.testConfig = config;
		this.firebaseConfig = {
			project_id: generateHex(4),
			databaseURL: `http://localhost:8102/?ns=${config.databaseName ?? 'demo-test'}`,
			isEmulator: true
		};

		process.env.FUNCTIONS_EMULATOR = 'true';
		ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: this.firebaseConfig}});
	}

	init() {
		// @ts-ignore
		ModuleManager.resetForTests();

		// @ts-ignore
		ModuleBE_APIs.resetForTests();

		new Storm({envKey: 'local', pathToDefaultConfig: '_config/default', pathToEnvOverrideConfig: '_config/test'})
			.addModulePack(this.testConfig.modules)
			.setConfig({...this.testConfig.config, isDebug: true,})
			.setInitialRouteResolver(new RouteResolver_Dummy())
			.init();
	}
}
