import {createApisForDBModuleV3} from '@thunder-storm/core/backend';
import {ModuleBE_PermissionProjectDB} from './ModuleBE_PermissionProjectDB';


export const ModulePackBE_PermissionProject = [ModuleBE_PermissionProjectDB, createApisForDBModuleV3(ModuleBE_PermissionProjectDB)];