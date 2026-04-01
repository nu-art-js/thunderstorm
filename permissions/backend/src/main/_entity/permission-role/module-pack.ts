import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionRoleDB} from './ModuleBE_PermissionRoleDB.js';

export const ModulePackBE_PermissionRole = [ModuleBE_PermissionRoleDB, createApisForDBModule(ModuleBE_PermissionRoleDB)];
