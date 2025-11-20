import {Module} from '@nu-art/ts-common';
import {ModuleBE_BackupDocDB} from './ModuleBE_BackupDocDB.js';
import {ModuleBE_BackupScheduler} from './ModuleBE_BackupScheduler.js';

export const ModulePackBE_BackupDocDB = [ModuleBE_BackupDocDB, ModuleBE_BackupScheduler] as Module[];