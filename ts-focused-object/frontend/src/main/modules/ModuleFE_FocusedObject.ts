import {_keys, debounce, filterDuplicates, Module, removeItemFromArray, Second, TypedMap, UniqueId} from '@nu-art/ts-common';
import {ApiCaller} from '@nu-art/http-client';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase-frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {API_FocusedObject, ApiDef_FocusedObject, FocusData_Map, FocusedEntity,} from '@nu-art/ts-focused-object-shared';
import {LoggedStatus, ModuleFE_Account, OnLoginStatusUpdated} from '@nu-art/user-account-frontend/index';
import {DefaultTTL_FocusedObject, getRelationalPath} from '@nu-art/ts-focused-object-shared/consts';
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

class FocusedDataDispatcher {
	private readonly listeners = new Set<OnFocusedDataReceived>();

	addListener(l: OnFocusedDataReceived): void {
		this.listeners.add(l);
	}

	removeListener(l: OnFocusedDataReceived): void {
		this.listeners.delete(l);
	}

	dispatchAll(map: FocusData_Map): void {
		this.listeners.forEach(l => l.__onFocusedDataReceived(map));
	}
}

export const dispatch_onFocusedDataReceived = new FocusedDataDispatcher();

export class ModuleFE_FocusedObject_Class
	extends Module
	implements OnLoginStatusUpdated {

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
		this.apiDebounce = debounce(this.updateRTDB, 2 * Second, 10 * Second);
	}

	init() {
		this.initFirebaseListening();
		this.initWindowFocusListeners();
		this.initWindowCloseListeners();
	}

	@ApiCaller(ApiDef_FocusedObject.update)
	async update(body: API_FocusedObject['update']['Body']): Promise<API_FocusedObject['update']['Response']> {
		return undefined as unknown as Promise<API_FocusedObject['update']['Response']>;
	}

	private initFirebaseListening = () => {
		this.focusFirebaseListener = ModuleFE_FirebaseListener.createListener(getRelationalPath());
		this.focusFirebaseListener.startListening(this.onRTDBChange);
	};

	private initWindowFocusListeners() {
		window.addEventListener('focus', this.onWindowFocus);
		window.addEventListener('blur', this.onWindowBlur);
	}

	private initWindowCloseListeners() {
		window.addEventListener('beforeunload', () => {
			void this.update({focusedEntities: []});
		});
	}


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


	private updateRTDB = () => {
		const focusedEntities = this.translateCurrentlyFocusedToFocusedEntities();
		this.update({focusedEntities})
			.catch(e => {
				this.logError('Update focused object failed', e);
			})
			.finally(() => {
				this.clearUnfocus();
				this.triggerKeepAlive();
			});
	};


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
		const account = ModuleFE_Account.getCurrentlyLoggedAccount();
		return ignoreCurrentUser ? userIds.filter(id => id !== account?._id) : userIds;
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