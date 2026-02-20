import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_MessageDB} from './ModuleBE_MessageDB.js';
import {ModuleBE_TopicDB} from './ModuleBE_TopicDB.js';

export const ModulePackBE_Messaging = [
	ModuleBE_MessageDB,
	createApisForDBModule(ModuleBE_MessageDB),
	ModuleBE_TopicDB,
	createApisForDBModule(ModuleBE_TopicDB),
];