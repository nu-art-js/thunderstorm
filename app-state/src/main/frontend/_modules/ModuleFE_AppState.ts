import {BadImplementationException, cloneObj, deepClone, exists, Logger, mergeObject, Module, TS_Object} from '@nu-art/ts-common';
import {StorageKey, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {AppState} from '../../shared';

export interface OnPageStateUpdated {
	__onPageStateUpdated: (manager: PageStateManager<any>) => void;
}

const dispatch_OnPageStateUpdated = new ThunderDispatcher<OnPageStateUpdated, '__onPageStateUpdated'>('__onPageStateUpdated');

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
		dispatch_OnPageStateUpdated.dispatchAll(manager);
	};

	public getPageState = (manager: PageStateManager<any>) => this.appState[manager.route] ?? {};
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

	// ######################### State Interaction #########################

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

	// ######################### Utils #########################

	public getDispatchListenerCB = (cb: VoidFunction) => {
		return (manager: PageStateManager<any>) => {
			if (manager === this)
				cb();
		};
	};
}