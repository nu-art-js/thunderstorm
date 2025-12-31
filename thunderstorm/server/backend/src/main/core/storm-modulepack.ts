import {Module} from '@nu-art/ts-common';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs.js';
import {ModulePackBE_ActionProcessor} from '@nu-art/thunder-action-processor-backend';
import {ModulePackBE_ServerInfo} from '@nu-art/thunder-server-info-backend';
import {ModulePackBE_BackupDocDB} from '@nu-art/thunder-backup-backend';
import {ModuleBE_CollectionActions} from '../modules/collection-actions/ModuleBE_CollectionActions.js';

export const ModulePack_ThunderstormBE: Module[] = [
	...ModulePackBE_ServerInfo,
	ModuleBE_APIs,
	...ModulePackBE_ActionProcessor,
	ModuleBE_CollectionActions,
	// ...ModulePackBE_EditableTest,
	...ModulePackBE_BackupDocDB,
];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;