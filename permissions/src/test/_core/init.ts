import {generateHex, ModuleManager} from '@nu-art/ts-common';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase/backend';
import {ModuleBE_APIs, Storm} from '@nu-art/thunderstorm/backend';
import {RouteResolver_Dummy} from '@nu-art/thunderstorm/backend/modules/server/route-resolvers/RouteResolver_Dummy';
import {ModuleBE_PermissionsAssert} from '../../main/backend';
import {ModuleBE_v2_AccountDB, ModuleBE_v2_SessionDB} from '@nu-art/user-account/backend';
import {ModuleBE_PermissionProject} from '../../main/backend/modules/management/ModuleBE_PermissionProject';
import {ModuleBE_PermissionDomain} from '../../main/backend/modules/management/ModuleBE_PermissionDomain';
import {ModuleBE_PermissionAccessLevel} from '../../main/backend/modules/management/ModuleBE_PermissionAccessLevel';
import {ModuleBE_PermissionApi} from '../../main/backend/modules/management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionUserDB} from '../../main/backend/modules/assignment/ModuleBE_PermissionUserDB';
import {ModuleBE_PermissionGroup} from '../../main/backend/modules/assignment/ModuleBE_PermissionGroup';
import {ModuleBE_v2_SyncManager} from '@nu-art/db-api-generator/backend';


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};

const accountModules = [
	ModuleBE_v2_SyncManager,
	ModuleBE_v2_AccountDB,
	ModuleBE_v2_SessionDB,
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
ModuleBE_v2_AccountDB.setDefaultConfig({canRegister: true});
ModuleBE_PermissionsAssert.setDefaultConfig({strictMode: true});


// @ts-ignore
ModuleManager.resetForTests();
// @ts-ignore
ModuleBE_APIs.resetForTests();

new Storm()
	.addModulePack(accountModules)
	.addModulePack(permissionModules)
	.setConfig({isDebug: true})
	.setInitialRouteResolver(new RouteResolver_Dummy())
	.init();
