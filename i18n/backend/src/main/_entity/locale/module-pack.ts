import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_LocaleDB} from './ModuleBE_LocaleDB.js';

export const ModulePackBE_LocaleDB = [ModuleBE_LocaleDB, createApisForDBModule(ModuleBE_LocaleDB)];
