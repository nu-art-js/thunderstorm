import {_keys, debounce, exists, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {
	ModuleFE_FirebaseListener,
	RefListenerFE
} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {ApiDef_FocusedObject, ApiStruct_FocusedObject, FocusData_Map} from '../../shared';


export interface OnFocusedDataReceived {
	__onFocusedDataReceived: (map: FocusData_Map) => void;
}

export const dispatch_onFocusedDataReceived = new ThunderDispatcher<OnFocusedDataReceived, '__onFocusedDataReceived'>('__onFocusedDataReceived');

const Default_FocusedObjectNodePath = '/state/ModuleBE_FocusedObject/focusedData'; // Hardcoded path for now per Adam's request, should be const somewhere.

export class ModuleFE_FocusedObject_Class
	extends Module {
	private debounceSync?: () => void;
	readonly _v1: ApiDefCaller<ApiStruct_FocusedObject>['_v1'];
	private focusFirebaseListener!: RefListenerFE<FocusData_Map>;
	private focusDataToWriteMap?: FocusData_Map;

	constructor() {
		super();
		this._v1 = {
			updateFocusObject: apiWithBody(ApiDef_FocusedObject._v1.updateFocusObject, async response => {
				//on completed?
			})
		};
		this.debounceSync = debounce(async () => {
			if (!this.focusFirebaseListener)
				return this.logWarning('Ignoring entity focus data state, listener is undefined');

			this.logDebug(`Focus data to update:`, this.focusDataToWriteMap);
			await this.focusEntity();
		}, 1000, 5000);
	}

	public async updateFocusData(focusData: TypedMap<string[]>) {
		const accountId = ModuleFE_Account.accountId;
		// fill focusDataToWriteMap
		const resultMap: FocusData_Map = {};
		const focusDBNames: string[] = _keys(focusData);
		focusDBNames.forEach(_dbName => {
			const itemIds = focusData[_dbName];
			itemIds.forEach(_itemId => {
				resultMap[_dbName][_itemId][accountId] = {timestamp: -1, event: 'focus'};// timestamp is set ONLY in BE

			});
		});

		this.focusDataToWriteMap = resultMap;

		await this.debounceFocusEntityImpl();
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

			await this.focusEntity();
		}, 1000, 5000);

		this.logInfo('Reading focused entities first time without debounce delay');
		await this.focusEntity();
	}

	private async focusEntity() {
		if (!this.focusDataToWriteMap) {
			this.logWarning('focusEntity was called despite not having any data to write to rtdb!');
			return;
		}

		await this._v1.updateFocusObject({currentFocusMap: this.focusDataToWriteMap}).setOnCompleted(async response => {
			this.focusDataToWriteMap = undefined;
		}).executeSync();
	}


	init() {
		this.focusFirebaseListener = ModuleFE_FirebaseListener.createListener(Default_FocusedObjectNodePath);
		this.focusFirebaseListener.startListening((snapshot) => {
			const value: FocusData_Map = snapshot.val();
			// Update all the FocusedEntityRef components
			dispatch_onFocusedDataReceived.dispatchAll(value);
		});
	}
}

export const ModuleFE_FocusedObject = new ModuleFE_FocusedObject_Class();