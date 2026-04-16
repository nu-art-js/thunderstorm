import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_AccessGroupDB} from './ModuleBE_AccessGroupDB.js';

export const ModulePackBE_AccessGroup = [ModuleBE_AccessGroupDB, createApisForDBModule(ModuleBE_AccessGroupDB)];
