import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_PermissionProjectDB} from './ModuleBE_PermissionProjectDB.js';


export const ModulePackBE_PermissionProject = [ModuleBE_PermissionProjectDB, createApisForDBModuleV3(ModuleBE_PermissionProjectDB)];