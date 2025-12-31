import {generateHex, ModuleManager} from '@nu-art/ts-common';
import {ModuleBE_Auth} from '@nu-art/google-services-backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase-backend';
import {ModuleBE_APIs, Storm} from '@nu-art/thunder-db-api-backend';
import {RouteResolver_Dummy} from '@nu-art/thunder-db-api-backend/modules/server/route-resolvers/RouteResolver_Dummy';
import {ModuleBE_PermissionsAssert} from '../main/index.js';
import {ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ModuleBE_PermissionProject} from '../main/modules/management/ModuleBE_PermissionProject.js';
import {ModuleBE_PermissionDomain} from '../main/modules/management/ModuleBE_PermissionDomain.js';
import {ModuleBE_PermissionAccessLevel} from '../main/modules/management/ModuleBE_PermissionAccessLevel.js';
import {ModuleBE_PermissionApi} from '../main/modules/management/ModuleBE_PermissionApi.js';
import {ModuleBE_PermissionUserDB} from '../main/modules/assignment/ModuleBE_PermissionUserDB.js';
import {ModuleBE_PermissionGroup} from '../main/modules/assignment/ModuleBE_PermissionGroup.js';



const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};

const accountModules = [
	ModuleBE_AccountDB,
	ModuleBE_SessionDB,
];

const permissionModules = [
	ModuleBE_PermissionProject,
	ModuleBE_PermissionDomain,
	ModuleBE_PermissionAccessLevel,
	ModuleBE_PermissionApi,
	ModuleBE_PermissionUserDB,
	ModuleBE_PermissionGroup,
	ModuleBE_PermissionsAssert,
];

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});
ModuleBE_AccountDB.setDefaultConfig({canRegister: true});
ModuleBE_PermissionsAssert.setDefaultConfig({strictMode: true});


// @ts-ignore
ModuleManager.__resetForTests();
// @ts-ignore
ModuleBE_APIs.__resetForTests();

new Storm()
	.addModulePack(accountModules)
	.addModulePack(permissionModules)
	.setConfig({isDebug: true})
	.setInitialRouteResolver(new RouteResolver_Dummy())
	.init();
