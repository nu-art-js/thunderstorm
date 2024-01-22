import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';
import {ModuleBE_PermissionUserAPI} from './ModuleBE_PermissionUserAPI';
import {Module} from '@nu-art/ts-common';


export const ModulePackBE_PermissionUser: Module[] = [ModuleBE_PermissionUserDB, ModuleBE_PermissionUserAPI];