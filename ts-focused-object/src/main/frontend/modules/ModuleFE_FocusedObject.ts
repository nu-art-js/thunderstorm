import {_keys, _values, debounce, exists, filterDuplicates, flatArray, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {
	ModuleFE_FirebaseListener,
	RefListenerFE
} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {
	ApiDef_FocusedObject,
	ApiStruct_FocusedObject,
	FocusData_Map,
	Focused,
	FocusEvent_Focused,
	FocusEvent_Unfocused
} from '../../shared';
import {LoggedStatus, ModuleFE_Account} from '@nu-art/user-account/frontend';
import {getRelationalPath} from '../../shared/consts';


export interface OnFocusedDataReceived {
	__onFocusedDataReceived: (map: FocusData_Map) => void;
}

export const dispatch_onFocusedDataReceived = new ThunderDispatcher<OnFocusedDataReceived, '__onFocusedDataReceived'>('__onFocusedDataReceived');

export class ModuleFE_FocusedObject_Class
	extends Module {
	private debounceSync?: () => void;
	readonly _v1: ApiDefCaller<ApiStruct_FocusedObject>['_v1'];
	private focusFirebaseListener!: RefListenerFE<FocusData_Map>;
	private focusDataMap: TypedMap<Focused[]> = {};

	constructor() {
		super();
		this._v1 = {
			updateFocusData: apiWithBody(ApiDef_FocusedObject._v1.updateFocusData),
			setFocusStatusByTabId: apiWithBody(ApiDef_FocusedObject._v1.setFocusStatusByTabId),
			releaseObject: apiWithBody(ApiDef_FocusedObject._v1.releaseObject),
			releaseByTabId: apiWithBody(ApiDef_FocusedObject._v1.releaseByTabId),
		};
		this.debounceSync = debounce(async () => {
			if (!this.focusFirebaseListener)
				return this.logWarning('Ignoring entity focus data state, listener is undefined');

			await this.sendFocusDataToRTDB();
		}, 1000, 5000);
	}

	init() {
		this.focusFirebaseListener = ModuleFE_FirebaseListener.createListener(getRelationalPath());
		this.focusFirebaseListener.startListening((snapshot) => {
			this.logDebug('Received firebase focus data');
			const value: FocusData_Map = snapshot.val();
			// Update all the FocusedEntityRef components
			dispatch_onFocusedDataReceived.dispatchAll(value);
		});

		this.listenToFocusEvents();
		this.listenToPageClosed();
	}

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

	private async focusWindow() {
		if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
			return;

		if (!_keys(this.focusDataMap))
			return this.logDebug('Received window focus event, but no data to change in rtdb.');

		await this._v1.setFocusStatusByTabId({event: FocusEvent_Focused}).executeSync();
	}

	private async unfocusWindow() {
		if (ModuleFE_Account.getLoggedStatus() !== LoggedStatus.LOGGED_IN)
			return;

		if (!_keys(this.focusDataMap))
			return this.logDebug('Received window unfocus(blur) event, but no data to change in rtdb.');

		await this._v1.setFocusStatusByTabId({event: FocusEvent_Unfocused}).executeSync();
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

	private listenToFocusEvents() {
		window.addEventListener('blur', async () => {
			await this.unfocusWindow();
		});
		window.addEventListener('focus', async () => {
			await this.focusWindow();
		});
	}

	private listenToPageClosed() {
		window.addEventListener('beforeunload', async (event) => {
			await this._v1.releaseByTabId({}).executeSync();
			// navigator.sendBeacon('/log', JSON.stringify({ type:'application/json' }));
		});
	}

	private compareFocusData(a: Focused, b: Focused): boolean {
		return a.dbName === b.dbName && a.itemId === b.itemId;
	}
}

export const ModuleFE_FocusedObject = new ModuleFE_FocusedObject_Class();