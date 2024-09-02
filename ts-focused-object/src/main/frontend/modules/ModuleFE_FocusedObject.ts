import {_keys, debounce, filterDuplicates, Module, removeItemFromArray, Second, TypedMap, UniqueId} from '@nu-art/ts-common';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {ApiDef_FocusedObject, ApiStruct_FocusedObject, FocusData_Map, FocusedEntity,} from '../../shared';
import {LoggedStatus, ModuleFE_Account, OnLoginStatusUpdated} from '@nu-art/user-account/frontend';
import {DefaultTTL_FocusedObject, getRelationalPath} from '../../shared/consts';
import {DataSnapshot} from 'firebase/database';

/*
	The logic for focus object is as follows:
	- Triggering a change in focus starts debounces a call to BE with the focused data.
		the debounce timeout is a hard coded 2 seconds.

	-	After a call to BE the module will set a keep-alive timer, which will call the BE with the same focused data over and over every
		TTL - 20 seconds. the purpose of this call is to prevent the data in BE from becoming stale by refreshing its timestamp.

	-	The keep-alive call is gated by a windowIsFocused flag that is changed by the window focus/blur events. this way if the window is not focused,
		no call for keep-alive will go through, the data will become stale and in the next update in BE it will be deleted and all the listeners will
		be updated.

	-	If the keep-alive timer triggered its callback and the window was not focused, the timer will be cleared, and will not attempt to trigger its
		callback again.

	- If the window regains focus after the keep-alive timer was cleared, an API call will be sent to update the focus object data the same as if
		a new item has gained focus.
 */

export interface OnFocusedDataReceived {
	__onFocusedDataReceived: (map: FocusData_Map) => void;
}

export const dispatch_onFocusedDataReceived = new ThunderDispatcher<OnFocusedDataReceived, '__onFocusedDataReceived'>('__onFocusedDataReceived');

export class ModuleFE_FocusedObject_Class
	extends Module
	implements OnLoginStatusUpdated {

	readonly _v1: ApiDefCaller<ApiStruct_FocusedObject>['_v1'];
	private focusFirebaseListener!: RefListenerFE<FocusData_Map>;
	private focusDataMap: FocusData_Map;
	private currentlyFocused: TypedMap<UniqueId[]> = {};
	private readonly apiDebounce: VoidFunction;
	private windowIsFocused: boolean = true;
	private unfocusTimeout: NodeJS.Timeout | undefined;
	private keepAliveTimeout: NodeJS.Timeout | undefined;

	__onLoginStatusUpdated() {
		const status = ModuleFE_Account.getLoggedStatus();
		if (status === LoggedStatus.LOGGED_OUT)
			this.onUserLoggedOut();
	}

	constructor() {
		super();
		this.focusDataMap = {};
		this._v1 = {
			// updateFocusData: apiWithBody(ApiDef_FocusedObject._v1.updateFocusData),
			// setFocusStatusByTabId: apiWithBody(ApiDef_FocusedObject._v1.setFocusStatusByTabId),
			// releaseObject: apiWithBody(ApiDef_FocusedObject._v1.releaseObject),
			// releaseByTabId: apiWithBody(ApiDef_FocusedObject._v1.releaseByTabId),
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
			this._v1.update({focusedEntities: []}).execute();
			// navigator.sendBeacon('/log', JSON.stringify({ type:'application/json' }));
		});
	}

	// ######################## Listener Callbacks ########################

	private onRTDBChange = (snapshot: DataSnapshot) => {
		this.focusDataMap = snapshot.val() ?? {} as FocusData_Map;
		this.logDebug('Received firebase focus data', this.focusDataMap);
		// Update all the FocusedEntityRef components
		dispatch_onFocusedDataReceived.dispatchAll(this.focusDataMap);
	};

	/**
	 * Callback for when the current window is focused.
	 * we change the class property "windowIsFocused" to true so when the time comes to
	 * send a keepalive to BE, the request will be sent if the window is focused.
	 * Will also trigger keepalive timer if the time is not already set
	 */
	private onWindowFocus = () => {
		this.windowIsFocused = true;
		//If the keep alive counter still exists, no need to trigger any extra further logic
		if (this.keepAliveTimeout)
			return;

		this.apiDebounce();
	};

	/**
	 * Callback for when the current window is un-focused.
	 * we change the class property "windowIsFocused" to false so when the time comes to
	 * send a keepalive to BE, the request will not be sent if the window is not focused
	 */
	private onWindowBlur = () => {
		this.windowIsFocused = false;
	};

	private onUserLoggedOut = () => {
		this.currentlyFocused = {};
	};

	// ######################## Timer Interactions ########################

	private triggerKeepAlive = () => {
		this.clearKeepAlive();
		//No need to set keepalive timeout if currentlyFocused has no data
		if (!_keys(this.currentlyFocused).length)
			return;

		this.keepAliveTimeout = setTimeout(() => {
			//No need to keepalive if window is not focused
			if (!this.windowIsFocused)
				return this.clearKeepAlive();

			this.apiDebounce();
		}, DefaultTTL_FocusedObject - 20 * Second);
	};

	private triggerUnfocus = () => {
		this.clearUnfocus();
		this.unfocusTimeout = setTimeout(() => this.apiDebounce(), 20 * Second);
	};

	private clearKeepAlive = () => {
		clearTimeout(this.keepAliveTimeout);
		delete this.keepAliveTimeout;
	};

	private clearUnfocus = () => {
		clearTimeout(this.unfocusTimeout);
		delete this.unfocusTimeout;
	};

	// ######################## API Logic ########################

	private updateRTDB = () => {
		//Call API
		const focusedEntities = this.translateCurrentlyFocusedToFocusedEntities();
		this._v1.update({focusedEntities})
			.executeSync()
			.then()
			.catch(e => {
				this.logError('Update focused object failed', e);
			})
			.finally(() => {
				this.clearUnfocus();
				this.triggerKeepAlive();
			});
	};

	// ######################## Logic ########################

	public focus = (entities: FocusedEntity[]) => {
		entities.forEach(entity => {
			if (!this.currentlyFocused[entity.dbKey])
				this.currentlyFocused[entity.dbKey] = [];

			this.currentlyFocused[entity.dbKey] = filterDuplicates([...this.currentlyFocused[entity.dbKey], entity.itemId]);
		});
		this.apiDebounce();
	};

	public unfocus = (entities: FocusedEntity[]) => {
		entities.forEach(entity => {
			if (!this.currentlyFocused[entity.dbKey])
				return;

			this.currentlyFocused[entity.dbKey] = removeItemFromArray(this.currentlyFocused[entity.dbKey], entity.itemId);
		});
		this.triggerUnfocus();
	};

	public getFocusData = (dbKey: string, itemId: UniqueId) => {
		return this.focusDataMap[dbKey]?.[itemId];
	};

	public getAccountIdsForFocusedItem = (dbKey: string, itemId: UniqueId, ignoreCurrentUser: boolean = true): UniqueId[] => {
		const data = this.getFocusData(dbKey, itemId);
		const userIds: UniqueId[] = data ? _keys(data) : [];
		return ignoreCurrentUser ? userIds.filter(id => id !== ModuleFE_Account.accountId) : userIds;
	};

	private translateCurrentlyFocusedToFocusedEntities = (): FocusedEntity[] => {
		const focusedEntities: FocusedEntity[] = [];
		_keys(this.currentlyFocused).forEach(dbKey => {
			this.currentlyFocused[dbKey].forEach(itemId => {
				focusedEntities.push({dbKey: dbKey as string, itemId});
			});
		});
		return focusedEntities;
	};
}

export const ModuleFE_FocusedObject = new ModuleFE_FocusedObject_Class();