import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_PermissionAPIDB} from './ModuleBE_PermissionAPIDB.js';


export const ModulePackBE_PermissionAPI = [ModuleBE_PermissionAPIDB, createApisForDBModuleV3(ModuleBE_PermissionAPIDB)];