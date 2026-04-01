import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionScopeDB} from './ModuleBE_PermissionScopeDB.js';

export const ModulePackBE_PermissionScope = [ModuleBE_PermissionScopeDB, createApisForDBModule(ModuleBE_PermissionScopeDB)];
