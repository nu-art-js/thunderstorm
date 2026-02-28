import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionProjectDB} from './ModuleBE_PermissionProjectDB.js';

export const ModulePackBE_PermissionProject = [ModuleBE_PermissionProjectDB, createApisForDBModule(ModuleBE_PermissionProjectDB)];