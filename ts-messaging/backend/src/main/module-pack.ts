import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_MessagingAccess} from './messaging-access-wiring.js';
import {ModuleBE_MessageDB} from './ModuleBE_MessageDB.js';
import {ModuleBE_TopicDB} from './ModuleBE_TopicDB.js';
import {ModuleBE_MessagingApi} from './ModuleBE_MessagingApi.js';

export const ModulePackBE_Messaging = [
	ModuleBE_MessagingAccess,
	ModuleBE_TopicDB,
	createApisForDBModule(ModuleBE_TopicDB),
	ModuleBE_MessageDB,
	createApisForDBModule(ModuleBE_MessageDB),
	ModuleBE_MessagingApi,
];
