import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';
import {ModuleBE_PermissionUserAPI} from './ModuleBE_PermissionUserAPI';
import {Module} from '@thunder-storm/common';


export const ModulePackBE_PermissionUser: Module[] = [ModuleBE_PermissionUserDB, ModuleBE_PermissionUserAPI];