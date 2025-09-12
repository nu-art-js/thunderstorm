import {ModuleBE_MessageDB} from '../_entity/message/backend/index.js';
import {ModuleBE_TopicDB} from '../_entity/topic/backend/index.js';
import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend/index';

export const ModulePackBE_Messaging = [
	ModuleBE_MessageDB, createApisForDBModuleV3(ModuleBE_MessageDB),
	ModuleBE_TopicDB, createApisForDBModuleV3(ModuleBE_TopicDB)
];