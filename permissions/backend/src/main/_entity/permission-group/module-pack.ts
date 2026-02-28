import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionGroupDB} from './ModuleBE_PermissionGroupDB.js';

export const ModulePackBE_PermissionGroup = [ModuleBE_PermissionGroupDB, createApisForDBModule(ModuleBE_PermissionGroupDB)];