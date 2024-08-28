import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB';
import {ModuleBE_AppConfigAPI} from './ModuleBE_AppConfigAPI';
import {Module} from '@thunder-storm/common';

export const ModulePackBE_AppConfigDB = [ModuleBE_AppConfigDB, ModuleBE_AppConfigAPI] as Module[];