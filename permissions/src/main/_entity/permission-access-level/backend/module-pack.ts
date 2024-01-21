import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PermissionAccessLevelDB} from './ModuleBE_PermissionAccessLevelDB';


export const ModulePackBE_PermissionAccessLevel = [ModuleBE_PermissionAccessLevelDB, createApisForDBModuleV3(ModuleBE_PermissionAccessLevelDB)];