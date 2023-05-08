import {Module} from '@nu-art/ts-common';
import {ModuleFE_Thunderstorm} from '../modules/ModuleFE_Thunderstorm';
import {ModuleFE_XhrHttp} from '../modules/http/ModuleFE_XhrHttp';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster';
import {ModuleFE_Dialog} from '../component-modules/ModuleFE_Dialog';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory';
import {ModuleFE_LocalStorage} from '../modules/ModuleFE_LocalStorage';
import {ModuleFE_Window} from '../modules/ModuleFE_Window';
import {ModuleFE_Notifications} from '../component-modules/ModuleFE_Notifications';
import {ModuleFE_ActionProcessor} from '../modules/action-processor/ModuleFE_ActionProcessor';


export const ModulePack_ThunderstormFE: Module[] = [
	ModuleFE_Thunderstorm,
	ModuleFE_XhrHttp,

	ModuleFE_Toaster,
	ModuleFE_Dialog,

	ModuleFE_RoutingV2,
	ModuleFE_BrowserHistory,

	ModuleFE_LocalStorage,
	ModuleFE_Window,
	ModuleFE_Notifications,
	ModuleFE_ActionProcessor,
];

