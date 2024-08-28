import {generateHex, ModuleManager} from '@thunder-storm/common';
import {ModuleBE_Auth} from '@thunder-storm/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@thunder-storm/firebase/backend';

import {ModuleBE_APIs, ModuleBE_SyncManager, Storm} from '@thunder-storm/core/backend';
import {RouteResolver_Dummy} from '@thunder-storm/core/backend/modules/server/route-resolvers/RouteResolver_Dummy';
import {ModuleBE_AccountDB, ModuleBE_SessionDB} from '../../main/backend';


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};

const modules = [
	ModuleBE_SyncManager,
	ModuleBE_AccountDB,
	ModuleBE_SessionDB
];

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

// @ts-ignore
ModuleManager.resetForTests();
// @ts-ignore
ModuleBE_APIs.resetForTests();

new Storm()
	.addModulePack(modules)
	.setConfig({isDebug: true,})
	.setEnvironment('local')
	.setInitialRouteResolver(new RouteResolver_Dummy())
	.init();