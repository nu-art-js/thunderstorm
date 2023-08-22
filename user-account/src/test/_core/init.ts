import {generateHex, ModuleManager} from '@nu-art/ts-common';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase/backend';
import {ModuleBE_v2_AccountDB, ModuleBE_v2_SessionDB} from '../../main/backend';

import {ModuleBE_APIs, Storm} from '@nu-art/thunderstorm/backend';
import {RouteResolver_Dummy} from '@nu-art/thunderstorm/backend/modules/server/route-resolvers/RouteResolver_Dummy';


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};

const modules = [
	ModuleBE_v2_SyncManager,
	ModuleBE_v2_AccountDB,
	ModuleBE_v2_SessionDB
];

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

// @ts-ignore
ModuleManager.resetForTests();
// @ts-ignore
ModuleBE_APIs.resetForTests();

new Storm()
	.addModulePack(modules)
	.setConfig({isDebug: true})
	.setInitialRouteResolver(new RouteResolver_Dummy())
	.init();