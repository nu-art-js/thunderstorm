import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_AccountDB} from './ModuleBE_AccountDB.js';

export const ModulePackBE_AccountDB = [
	ModuleBE_AccountDB, createApisForDBModule(ModuleBE_AccountDB),
];
