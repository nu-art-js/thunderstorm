import {Module} from '@nu-art/ts-common';
import {ModuleFE_Toaster} from './component-modules/ModuleFE_Toaster.js';
import {ModuleFE_Dialog} from './component-modules/ModuleFE_Dialog.js';
import {ModuleFE_Notifications} from './component-modules/ModuleFE_Notifications.js';
import {ModuleFE_MouseInteractivity} from './component-modules/mouse-interactivity/index.js';
import {ModuleFE_BaseTheme} from './modules/ModuleFE_BaseTheme.js';

export const ModulePackFE_UIModules: Module[] = [
	ModuleFE_Toaster,
	ModuleFE_Dialog,
	ModuleFE_Notifications,
	ModuleFE_MouseInteractivity,
	ModuleFE_BaseTheme,
];
