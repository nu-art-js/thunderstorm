import {Module} from '@nu-art/ts-common';
import {ModuleBE_APIs} from '../modules/ModuleBE_APIs.js';
import {ModuleBE_ServerInfo} from '../modules/ModuleBE_ServerInfo.js';
import {ModuleBE_CollectionActions} from '../modules/collection-actions/ModuleBE_CollectionActions.js';

export const ModulePack_ThunderstormBE: Module[] = [
	ModuleBE_ServerInfo,
	ModuleBE_APIs,
	ModuleBE_CollectionActions,
];

export const ModulePackBE_Thunderstorm = ModulePack_ThunderstormBE;