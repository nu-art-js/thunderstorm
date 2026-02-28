import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionAccessLevelDB} from './ModuleBE_PermissionAccessLevelDB.js';

export const ModulePackBE_PermissionAccessLevel = [ModuleBE_PermissionAccessLevelDB, createApisForDBModule(ModuleBE_PermissionAccessLevelDB)];