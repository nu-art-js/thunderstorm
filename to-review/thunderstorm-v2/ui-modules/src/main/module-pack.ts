import {Module} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from '../../../widgets/src/main/component-modules/ModuleFE_Toaster.js';
import {ModuleFE_Dialog} from '../../../widgets/src/main/component-modules/ModuleFE_Dialog.js';
import {ModuleFE_Notifications} from '../../../widgets/src/main/component-modules/ModuleFE_Notifications.js';

export const ModulePackFE_UIModules: Module[] = [
	ModuleFE_Toaster,
	ModuleFE_Dialog,
	ModuleFE_Notifications,
];
