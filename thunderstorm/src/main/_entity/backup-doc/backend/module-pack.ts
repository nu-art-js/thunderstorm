import {Module} from '@thunder-storm/common';
import {ModuleBE_BackupDocDB} from './ModuleBE_BackupDocDB';
import {ModuleBE_BackupScheduler} from './ModuleBE_BackupScheduler';

export const ModulePackBE_BackupDocDB = [ModuleBE_BackupDocDB, ModuleBE_BackupScheduler] as Module[];