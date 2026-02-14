import {Module} from '@nu-art/ts-common';
import {ModuleFE_Thunderstorm} from '../modules/ModuleFE_Thunderstorm.js';
import {ModuleFE_XHR} from '../modules/http/ModuleFE_XHR.js';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster.js';
import {ModuleFE_Dialog} from '../component-modules/ModuleFE_Dialog.js';
import {ModuleFE_RoutingV2} from '../modules/routing/index.js';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory.js';
import {ModuleFE_LocalStorage} from '../modules/ModuleFE_LocalStorage.js';
import {ModuleFE_Window} from '../modules/ModuleFE_Window.js';
import {ModuleFE_Notifications} from '../component-modules/ModuleFE_Notifications.js';
import {ModuleFE_WindowMessenger} from '../modules/ModuleFE_WindowMessenger.js';
import {ModuleFE_Print} from '../modules/ModuleFE_Print.js';
import {ModuleFE_CollectionActions} from '../modules/ModuleFE_CollectionActions.js';

export const ModulePack_ThunderstormFE: Module[] = [
	ModuleFE_Thunderstorm,
	ModuleFE_Print,
	ModuleFE_XHR,

	ModuleFE_Toaster,
	ModuleFE_Dialog,

	ModuleFE_RoutingV2,
	ModuleFE_BrowserHistory,

	ModuleFE_LocalStorage,
	ModuleFE_Window,
	ModuleFE_WindowMessenger,
	ModuleFE_Notifications,
	ModuleFE_CollectionActions,
];

export const ModulePackFE_Thunderstorm = ModulePack_ThunderstormFE;

