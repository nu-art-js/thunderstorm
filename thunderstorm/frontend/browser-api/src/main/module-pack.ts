import {Module} from '@nu-art/ts-common';
import {ModuleFE_BrowserHistory} from './modules/ModuleFE_BrowserHistory.js';
import {ModuleFE_BrowserHistoryV2} from './modules/ModuleFE_BrowserHistoryV2.js';
import {ModuleFE_Window} from './modules/ModuleFE_Window.js';
import {ModuleFE_WindowMessenger} from './modules/ModuleFE_WindowMessenger.js';
import {ModuleFE_LocalStorage} from './modules/ModuleFE_LocalStorage.js';
import {ModuleFE_StorageCleaner} from './modules/ModuleFE_StorageCleaner.js';
import {ModuleFE_BroadcastChannel} from './modules/ModuleFE_BroadcastChannel/ModuleFE_BroadcastChannel.js';
import {ModuleFE_Print} from './modules/ModuleFE_Print.js';
import {ModuleFE_ConnectivityModule} from './modules/ModuleFE_ConnectivityModule.js';

export const ModulePackFE_BrowserApi: Module[] = [
	ModuleFE_BrowserHistory,
	ModuleFE_BrowserHistoryV2,
	ModuleFE_Window,
	ModuleFE_WindowMessenger,
	ModuleFE_LocalStorage,
	ModuleFE_StorageCleaner,
	ModuleFE_BroadcastChannel,
	ModuleFE_Print,
	ModuleFE_ConnectivityModule,
];
