import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend/index';
import {ModuleBE_PermissionGroupDB} from './ModuleBE_PermissionGroupDB.js';


export const ModulePackBE_PermissionGroup = [ModuleBE_PermissionGroupDB, createApisForDBModuleV3(ModuleBE_PermissionGroupDB)];