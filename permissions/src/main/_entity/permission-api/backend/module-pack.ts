import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend/index';
import {ModuleBE_PermissionAPIDB} from './ModuleBE_PermissionAPIDB.js';


export const ModulePackBE_PermissionAPI = [ModuleBE_PermissionAPIDB, createApisForDBModuleV3(ModuleBE_PermissionAPIDB)];