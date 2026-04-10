import {ModuleBE_UserPermissionsDB} from './ModuleBE_UserPermissionsDB.js';
import {ModuleBE_UserPermissionsAPI} from './ModuleBE_UserPermissionsAPI.js';
import {Module} from '@nu-art/ts-common';

export const ModulePackBE_UserPermissions: Module[] = [ModuleBE_UserPermissionsDB, ModuleBE_UserPermissionsAPI];
