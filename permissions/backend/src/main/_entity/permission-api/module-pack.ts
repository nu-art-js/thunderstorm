import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionAPIDB} from './ModuleBE_PermissionAPIDB.js';

export const ModulePackBE_PermissionAPI = [ModuleBE_PermissionAPIDB, createApisForDBModule(ModuleBE_PermissionAPIDB)];