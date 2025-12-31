import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_MessageDB} from './ModuleBE_MessageDB.js';
import {ModuleBE_TopicDB} from './ModuleBE_TopicDB.js';

export const ModulePackBE_Messaging = [
	ModuleBE_MessageDB, createApisForDBModuleV3(ModuleBE_MessageDB),
	ModuleBE_TopicDB, createApisForDBModuleV3(ModuleBE_TopicDB)
];