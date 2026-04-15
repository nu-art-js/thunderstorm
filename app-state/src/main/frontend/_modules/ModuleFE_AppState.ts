import {_keys, BadImplementationException, cloneObj, composeUrl, deepClone, exists, Logger, mergeObject, Module, TS_Object} from '@nu-art/ts-common';
import {StorageKey, ThunderDispatcher} from '@nu-art/thunder-core';
import {ModuleFE_Routing} from '@nu-art/thunder-routing';
import {ModuleFE_Clipboard} from '@nu-art/thunder-widgets';
import {AppState} from '../../shared/types.js';
import {URLParam_AppState} from './consts.js';

function encodeStateBase64(decoded: AppState): string {
	return typeof window !== 'undefined' ? window.btoa(JSON.stringify(decoded)) : '';
}

function decodeStateBase64(encoded: string): AppState {
	try {
		const decoded = typeof window !== 'undefined' ? window.atob(encoded) : '';
		return decoded ? (JSON.parse(decoded) as AppState) : {};
	} catch {
		return {};
	}
}


export interface OnPageStateUpdated {
	__onPageStateUpdated: (manager: PageStateManager<any>) => void;
}

export const dispatch_OnPageStateUpdated = new ThunderDispatcher<OnPageStateUpdated, '__onPageStateUpdated'>('__onPageStateUpdated');

type PathRegistry = { [path: string]: PageStateManager<any> };

class ModuleFE_AppState_Class
	extends Module {

	private readonly pathRegistry: PathRegistry;
	private readonly appState: AppState;
	private readonly localStorage: StorageKey<AppState>;
	private readonly sessionStorage: StorageKey<AppState>;

	constructor() {
		super();
		this.localStorage = new StorageKey<AppState>('app-state', true);
		this.sessionStorage = new StorageKey<AppState>('app-state', false);
		this.pathRegistry = {};
		this.appState = this.sessionStorage.get(() => this.localStorage.get({}));
		this.deriveStateFromURLParam();
	}

	public registerManager = (manager: PageStateManager<any>) => {
		if (exists(this.pathRegistry[manager.route]))
			throw new BadImplementationException(`A manager is already registered for route: ${manager.route}`);

		this.pathRegistry[manager.route] = manager;
	};


	public setPageState = (manager: PageStateManager<any>, state: TS_Object) => {
		this.appState[manager.route] = state;
		this.sessionStorage.set(this.appState);
		this.localStorage.set(this.appState);
	};

	public getPageState = (manager: PageStateManager<any>) => this.appState[manager.route] ?? {};


	private deriveStateFromURLParam = () => {
		const encoded = ModuleFE_Routing.getQueryParameter(URLParam_AppState);
		if (!exists(encoded))
			return;

		const decoded = this.decodeState(encoded);
		_keys(decoded).forEach(key => {
			this.appState[key] = mergeObject(this.appState[key], decoded[key]);
		});
		ModuleFE_Routing.removeQueryParam(URLParam_AppState);
	};

	public getExportStateForManager = (manager: PageStateManager<any>) => {
		const pageState = this.getPageState(manager);
		const appState = {[manager.route]: pageState};
		const encoded = this.encodeState(appState);
		const baseUrl = window.location.origin + manager.route;
		return composeUrl(baseUrl, {[URLParam_AppState]: encoded});
	};

	private encodeState = (decoded: AppState): string => {
		return encodeStateBase64(decoded);
	};

	private decodeState = (encoded: string): AppState => {
		return decodeStateBase64(encoded);
	};
}

const ModuleFE_AppState = new ModuleFE_AppState_Class();

export class PageStateManager<PageState extends TS_Object>
	extends Logger {

	public readonly route: string;

	constructor(route: string) {
		super();
		this.route = route;
		ModuleFE_AppState.registerManager(this);
	}


	public value = {
		get: <K extends keyof PageState>(stateKey: K): PageState[K] => {
			const pageState = this.state.get();
			return pageState[stateKey];
		},
		set: <K extends keyof PageState>(stateKey: K, value: PageState[K]): void => {
			const _value = deepClone(value);
			const nextPageState = this.state.get();
			nextPageState[stateKey] = _value;
			ModuleFE_AppState.setPageState(this, nextPageState);
		}
	};

	public state = {
		get: (): PageState => {
			return ModuleFE_AppState.getPageState(this) as PageState;
		},
		set: (state: Partial<PageState>): void => {
			const prevPageState = this.state.get();
			const nextPageState = mergeObject(prevPageState, cloneObj(state)) as PageState;
			ModuleFE_AppState.setPageState(this, nextPageState);
		}
	};


	public getDispatchListenerCB = (cb: VoidFunction) => {
		return (manager: PageStateManager<any>) => {
			if (manager === this)
				cb();
		};
	};

	public getExportURL = () => {
		const url = ModuleFE_AppState.getExportStateForManager(this);
		void ModuleFE_Clipboard.copyToClipboard(url, 'Export URL copied to clipboard');
	};
}