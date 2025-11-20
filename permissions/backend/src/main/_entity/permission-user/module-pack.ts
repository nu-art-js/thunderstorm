import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB.js';
import {ModuleBE_PermissionUserAPI} from './ModuleBE_PermissionUserAPI.js';
import {Module} from '@nu-art/ts-common';


export const ModulePackBE_PermissionUser: Module[] = [ModuleBE_PermissionUserDB, ModuleBE_PermissionUserAPI];