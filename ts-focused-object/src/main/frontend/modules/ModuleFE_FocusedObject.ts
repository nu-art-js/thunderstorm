import {_keys, _values, debounce, exists, filterDuplicates, flatArray, Module, removeItemFromArray, Second, TypedMap, UniqueId} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {ApiDef_FocusedObject, ApiStruct_FocusedObject, FocusData_Map, Focused,} from '../../shared';
import {LoggedStatus, ModuleFE_Account, OnLoginStatusUpdated} from '@nu-art/user-account/frontend';
import {DefaultTTL_Unfocus, getRelationalPath} from '../../shared/consts';
import {DataSnapshot} from 'firebase/database';


export interface OnFocusedDataReceived {
	__onFocusedDataReceived: (map: FocusData_Map) => void;
}

export const dispatch_onFocusedDataReceived = new ThunderDispatcher<OnFocusedDataReceived, '__onFocusedDataReceived'>('__onFocusedDataReceived');

export class ModuleFE_FocusedObject_Class
	extends Module
	implements OnLoginStatusUpdated {

	readonly _v1: ApiDefCaller<ApiStruct_FocusedObject>['_v1'];
	private focusFirebaseListener!: RefListenerFE<FocusData_Map>;
	private focusDataMap: FocusData_Map = {};
	private currentlyFocused: TypedMap<UniqueId[]> = {};
	private readonly apiDebounce: VoidFunction;
	private windowIsFocused: boolean = true;
	private unfocusTimeout: NodeJS.Timeout | undefined;
	private keepAliveTimeout: NodeJS.Timeout | undefined;

	__onLoginStatusUpdated() {
		const status = ModuleFE_Account.getLoggedStatus();
		if (status === LoggedStatus.LOGGED_OUT)
			this.onUserLoggedOut();
	};

	constructor() {
		super();
		this._v1 = {
			updateFocusData: apiWithBody(ApiDef_FocusedObject._v1.updateFocusData),
			setFocusStatusByTabId: apiWithBody(ApiDef_FocusedObject._v1.setFocusStatusByTabId),
			releaseObject: apiWithBody(ApiDef_FocusedObject._v1.releaseObject),
			releaseByTabId: apiWithBody(ApiDef_FocusedObject._v1.releaseByTabId),
			update: apiWithBody(ApiDef_FocusedObject._v1.update),
		};
		this.apiDebounce = debounce(this.updateRTDB, 2 * Second, 10 * Second);
	}

	init() {
		this.initFirebaseListening();
		this.initWindowFocusListeners();
		this.initWindowCloseListeners();
	}

	// ######################## Init listeners ########################

	private initFirebaseListening = () => {
		this.focusFirebaseListener = ModuleFE_FirebaseListener.createListener(getRelationalPath());
		this.focusFirebaseListener.startListening(this.onRTDBChange);
	};

	private initWindowFocusListeners() {
		window.addEventListener('focus', this.onWindowFocus);
		window.addEventListener('blur', this.onWindowBlur);
	}

	private initWindowCloseListeners() {
		window.addEventListener('beforeunload', async (event) => {
			await this._v1.releaseByTabId({}).executeSync();
			// navigator.sendBeacon('/log', JSON.stringify({ type:'application/json' }));
		});
	}

	// ######################## Listener Callbacks ########################

	private onRTDBChange = (snapshot: DataSnapshot) => {
		this.focusDataMap = snapshot.val() as FocusData_Map;
		this.logDebug('Received firebase focus data', this.focusDataMap);
		// Update all the FocusedEntityRef components
		dispatch_onFocusedDataReceived.dispatchAll(this.focusDataMap);
	};

	private onWindowFocus = () => {
		this.windowIsFocused = true;
	};

	private onWindowBlur = () => {
		this.windowIsFocused = false;
	};

	private onUserLoggedOut = () => {
		//If user is logged out
		this.currentlyFocused = {};
		
	};

	// private async focusWindow() {
	// 	if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
	// 		return;
	//
	// 	if (!_keys(this.focusDataMap))
	// 		return this.logDebug('Received window focus event, but no data to change in rtdb.');
	//
	// 	await this._v1.setFocusStatusByTabId({event: FocusEvent_Focused}).executeSync();
	// }
	//
	// private async unfocusWindow() {
	// 	if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
	// 		return;
	//
	// 	if (!_keys(this.focusDataMap))
	// 		return this.logDebug('Received window unfocus(blur) event, but no data to change in rtdb.');
	//
	// 	await this._v1.setFocusStatusByTabId({event: FocusEvent_Unfocused}).executeSync();
	// }

	// ######################## Timer Interactions ########################

	private triggerKeepAlive = () => {
		clearTimeout(this.keepAliveTimeout);
		//No need to set keepalive timeout if currentlyFocused has no data
		if (!_keys(this.currentlyFocused).length)
			return;

		this.keepAliveTimeout = setTimeout(() => {
			//No need to keepalive if window is not focused
			if (!this.windowIsFocused)
				return;

			this.apiDebounce();
		}, DefaultTTL_Unfocus - 20 * Second);
	};

	// ######################## API Logic ########################

	private updateRTDB = () => {
		//Call API
		this._v1.update({currentlyFocused: this.currentlyFocused})
			.executeSync()
			.then()
			.catch(e => {
				this.logError('Update focused object failed', e);
			})
			.finally(() => {
				//Set / Clear timers
				clearTimeout(this.unfocusTimeout);
				this.triggerKeepAlive();
			});
	};

	// ######################## Logic ########################

	public focus = (dbKey: string, itemId: UniqueId) => {
		if (!this.currentlyFocused[dbKey])
			this.currentlyFocused[dbKey] = [];

		this.currentlyFocused[dbKey] = filterDuplicates([...this.currentlyFocused[dbKey], itemId]);
		this.apiDebounce();
	};

	public unfocus = (dbKey: string, itemId: UniqueId) => {
		if (!this.currentlyFocused[dbKey])
			return;

		this.currentlyFocused[dbKey] = removeItemFromArray(this.currentlyFocused[dbKey], itemId);
		clearTimeout(this.unfocusTimeout);
		this.unfocusTimeout = setTimeout(() => this.apiDebounce(), 20 * Second);
	};


	async focusData(focusId: string, focusData: Focused[]) {
		// We want to check if the focusDataMap already has this new focusData. If it doesn't, then we want to update the RTDB.
		delete this.focusDataMap[focusId];

		const focusDataComponentValues: Focused[] = this.getFocusDataMapAsArray();
		// If focusData is not already included in the focusDataMap, update RTDB.
		if (!focusData.every(newFocus => !!focusDataComponentValues.find(existingFocus => existingFocus.dbName === newFocus.dbName && existingFocus.itemId === newFocus.itemId)))
			await this.debounceFocusEntityImpl();

		this.focusDataMap[focusId] = focusData;
	}

	private getFocusDataMapAsArray() {
		return filterDuplicates(flatArray(_values(this.focusDataMap)), item => `${item.dbName}${item.itemId}`);
	}

	private async debounceFocusEntityImpl() {
		// Everytime after the first, we'll have the debounceSync const ready, amd debounce the call.
		if (exists(this.debounceSync))
			return this.debounceSync();

		// Since RTDB event arrives upon start listening we would like to perform a first read immediately,
		// therefore we call de directly for the first event and create the debounce function right after for all the consecutive events
		this.debounceSync = debounce(async () => {
			if (!this.focusFirebaseListener)
				return this.logWarning('Ignoring writing FocusedObjects, listener is undefined');

			await this.sendFocusDataToRTDB();
		}, 1000, 5000);

		this.logDebug('Reading focused entities first time without debounce delay');
		await this.sendFocusDataToRTDB();
	}

	private async sendFocusDataToRTDB() {
		if (!_keys(this.focusDataMap))
			return this.logWarning('sendFocusDataToRTDB was called despite not having any data to write to rtdb!');

		if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
			return;

		await this._v1.updateFocusData({
			focusData: this.getFocusDataMapAsArray(),
			event: document.hasFocus() ? 'focus' : 'unfocused',
		}).executeSync();
	}

	public async releaseFocusData(focusId: string, focusDataToRelease: Focused[]) {
		if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
			return;

		delete this.focusDataMap[focusId];

		const mappedFocusData = this.getFocusDataMapAsArray();

		// focusDataToRelease is data the component sent to release. Verify it isn't focused currently by other components.
		const dataWeCanRelease = focusDataToRelease.reduce<Focused[]>((toRelease, current) => {
			if (!mappedFocusData.find(item => this.compareFocusData(current, item)))
				toRelease.push(current);

			return toRelease;
		}, []);


		// dataWeCanRelease is data we verified is not focused currently by other components in this app.
		await this._v1.releaseObject({objectsToRelease: dataWeCanRelease}).executeSync();
	}

	getWindowFocusState() {
		return document.hasFocus();
	}

	private compareFocusData(a: Focused, b: Focused): boolean {
		return a.dbName === b.dbName && a.itemId === b.itemId;
	}
}

export const ModuleFE_FocusedObject = new ModuleFE_FocusedObject_Class();