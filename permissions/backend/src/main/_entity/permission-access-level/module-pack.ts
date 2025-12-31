import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_PermissionAccessLevelDB} from './ModuleBE_PermissionAccessLevelDB.js';


export const ModulePackBE_PermissionAccessLevel = [ModuleBE_PermissionAccessLevelDB, createApisForDBModuleV3(ModuleBE_PermissionAccessLevelDB)];