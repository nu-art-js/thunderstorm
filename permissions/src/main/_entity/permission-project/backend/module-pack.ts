import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PermissionProjectDB} from './ModuleBE_PermissionProjectDB';


export const ModulePackBE_PermissionProject = [ModuleBE_PermissionProjectDB, createApisForDBModuleV3(ModuleBE_PermissionProjectDB)];