import {Module} from '@nu-art/ts-common';
import {ModuleFE_Thunderstorm} from '../modules/ModuleFE_Thunderstorm';
import {XhrHttpModule} from '../modules/http/XhrHttpModule';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster';
import {ModuleFE_Dialog} from '../component-modules/ModuleFE_Dialog';
import {ModuleFE_Routing} from '../modules/routing/ModuleFE_Routing';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory';
import {ModuleFE_LocalStorage} from '../modules/ModuleFE_LocalStorage';


export const ModulePack_ThunderstormFE: Module[] = [
	ModuleFE_Thunderstorm,
	XhrHttpModule,

	ModuleFE_Toaster,
	ModuleFE_Dialog,

	ModuleFE_Routing,
	ModuleFE_RoutingV2,
	ModuleFE_BrowserHistory,

	ModuleFE_LocalStorage,
];
