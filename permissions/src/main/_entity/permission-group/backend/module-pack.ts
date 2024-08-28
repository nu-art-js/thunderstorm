import {createApisForDBModuleV3} from '@thunder-storm/core/backend';
import {ModuleBE_PermissionGroupDB} from './ModuleBE_PermissionGroupDB';


export const ModulePackBE_PermissionGroup = [ModuleBE_PermissionGroupDB, createApisForDBModuleV3(ModuleBE_PermissionGroupDB)];