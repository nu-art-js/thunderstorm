import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_LocalizedStringDB} from './ModuleBE_LocalizedStringDB.js';

export const ModulePackBE_LocalizedStringDB = [ModuleBE_LocalizedStringDB, createApisForDBModule(ModuleBE_LocalizedStringDB)];
