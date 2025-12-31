import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_PermissionGroupDB} from './ModuleBE_PermissionGroupDB.js';


export const ModulePackBE_PermissionGroup = [ModuleBE_PermissionGroupDB, createApisForDBModuleV3(ModuleBE_PermissionGroupDB)];