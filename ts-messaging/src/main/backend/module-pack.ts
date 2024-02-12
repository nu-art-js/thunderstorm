import {ModuleBE_MessageDB} from '../_entity/message/backend';
import {ModuleBE_TopicDB} from '../_entity/topic/backend';
import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';

export const ModulePackBE_Messaging = [
	ModuleBE_MessageDB, createApisForDBModuleV3(ModuleBE_MessageDB),
	ModuleBE_TopicDB, createApisForDBModuleV3(ModuleBE_TopicDB)
];