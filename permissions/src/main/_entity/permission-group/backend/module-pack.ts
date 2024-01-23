import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PermissionGroupDB} from './ModuleBE_PermissionGroupDB';


export const ModulePackBE_PermissionGroup = [ModuleBE_PermissionGroupDB, createApisForDBModuleV3(ModuleBE_PermissionGroupDB)];