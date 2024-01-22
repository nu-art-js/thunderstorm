import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PermissionAPIDB} from './ModuleBE_PermissionAPIDB';


export const ModulePackBE_PermissionAPI = [ModuleBE_PermissionAPIDB, createApisForDBModuleV3(ModuleBE_PermissionAPIDB)];