import {Module} from '@nu-art/ts-common';
import {ModuleFE_XhrHttp} from './http/ModuleFE_XhrHttp';

export * from './ModuleFE_BrowserHistory';
export * from './ModuleFE_ConnectivityModule';
export * from './ModuleFE_ForceUpgrade';
export * from './ModuleFE_Window';
export * from './ModuleFE_WindowMessenger';
export * from './ModuleFE_Locale';
export * from './ModuleFE_LocalStorage';
export * from './ModuleFE_Theme';
export * from './ModuleFE_Thunderstorm';
export * from './clearWebsiteDataDispatcher';

export * from './routing';
export * from './http/ModuleFE_XhrHttp';
export * from './action-processor/ModuleFE_ActionProcessor';
export * from './component-loader';


export const ModulePackFE_TSEssentials: Module[] = [
	ModuleFE_XhrHttp,
];