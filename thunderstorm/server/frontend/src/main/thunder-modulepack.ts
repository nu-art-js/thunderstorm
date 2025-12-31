import {Module} from '@nu-art/ts-common';
import {ModulePackFE_ActionProcessor} from '@nu-art/thunder-action-processor-frontend';
import {ModuleFE_CollectionActions} from '../modules/ModuleFE_CollectionActions.js';

export const ModulePack_ThunderstormFE: Module[] = [
	// ...ModulePackFE_Utils,
	// ...ModulePackFE_Http,
	// ...ModulePackFE_BrowserApi,
	// ...ModulePackFE_Routing,
	// ...ModulePackFE_UIModules,
	...ModulePackFE_ActionProcessor,
	ModuleFE_CollectionActions,
	// ModuleFE_EditableTest,
];

export const ModulePackFE_Thunderstorm = ModulePack_ThunderstormFE;

