import {Module} from '@nu-art/ts-common';
import {ModuleFE_Thunderstorm} from '../modules/ModuleFE_Thunderstorm';
import {ModuleFE_XHR} from '../modules/http/ModuleFE_XHR';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster';
import {ModuleFE_Dialog} from '../component-modules/ModuleFE_Dialog';
import {ModuleFE_RoutingV2} from '../modules/routing';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory';
import {ModuleFE_LocalStorage} from '../modules/ModuleFE_LocalStorage';
import {ModuleFE_Window} from '../modules/ModuleFE_Window';
import {ModuleFE_Notifications} from '../component-modules/ModuleFE_Notifications';
import {ModuleFE_ActionProcessor} from '../modules/action-processor/ModuleFE_ActionProcessor';
import {ModuleFE_UpgradeCollection} from '../modules/upgrade-collection/ModuleFE_UpgradeCollection';
import {ModuleFE_SyncManagerV2} from '../modules/sync-manager/ModuleFE_SyncManagerV2';
import {ModuleFE_AppConfig} from '../modules/app-config/ModuleFE_AppConfig';
import {ModuleFE_WindowMessenger} from '../modules/ModuleFE_WindowMessenger';


export const ModulePack_ThunderstormFE: Module[] = [
	ModuleFE_Thunderstorm,
	ModuleFE_XHR,
	ModuleFE_SyncManagerV2,

	ModuleFE_Toaster,
	ModuleFE_Dialog,

	ModuleFE_RoutingV2,
	ModuleFE_BrowserHistory,

	ModuleFE_LocalStorage,
	ModuleFE_Window,
	ModuleFE_WindowMessenger,
	ModuleFE_Notifications,
	ModuleFE_ActionProcessor,
	ModuleFE_UpgradeCollection,
	ModuleFE_AppConfig,
];

export const ModulePackFE_Thunderstorm = ModulePack_ThunderstormFE;

