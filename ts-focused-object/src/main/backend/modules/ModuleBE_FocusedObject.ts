import {_keys, currentTimeMillis, flatArray, Module, UniqueId} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {Header_TabId, MemKey_AccountId, OnPreLogout} from '@nu-art/user-account/backend';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {
	ApiDef_FocusedObject,
	FocusData_Map,
	FocusData_Object,
	Focused, FocusEvent_Focused, FocusEvent_Unfocused,
	Request_ReleaseObject,
	Request_SetFocusStatus,
	Request_UpdateFocusObject
} from '../../shared';
import {DefaultTTL_Focus, DefaultTTL_Unfocus, getRelationalPath} from '../../shared/consts';

type Config = {
	TTL: {
		focus?: number
		unfocused?: number
	}
}

export class ModuleBE_FocusedObject_Class
	extends Module<Config>
	implements OnPreLogout {
	__onPreLogout = async () => {
		await this.releaseByAccountId();
	};

	protected init() {
		addRoutes([
			createBodyServerApi(ApiDef_FocusedObject._v1.setFocusStatusByTabId, this.setFocusStatusByTab), // set-focus-status
			createBodyServerApi(ApiDef_FocusedObject._v1.updateFocusData, this.focusData), // focus
			createBodyServerApi(ApiDef_FocusedObject._v1.releaseObject, this.releaseObject), // release
			createBodyServerApi(ApiDef_FocusedObject._v1.releaseByTabId, this.releaseByTabId), // release-tab
		]);
	}

	private focusData = async (request: Request_UpdateFocusObject) => {
		if (request.focusData.length === 0)
			return;

		const objectToWrite: FocusData_Object = {timestamp: currentTimeMillis(), event: request.event};

		const rootRef = this.getRootRef();
		const patchData: FocusData_Map = {};
		request.focusData.forEach(toFocus => (patchData[this.getPathToObject(toFocus)] as any) = objectToWrite);
		await rootRef.patch(patchData);

		// Clean expired
		await this.cleanExpiredNodes();
	};

	releaseObject = async (request: Request_ReleaseObject) => {
		if (request.objectsToRelease.length === 0)
			return;

		const patchData: FocusData_Map = {};
		request.objectsToRelease.forEach(focusItem => (patchData[this.getPathToObject(focusItem)] as any) = null);
		const rootRef = this.getRootRef();
		await rootRef.patch(patchData);
	};

	setFocusStatusByTab = async (request: Request_SetFocusStatus) => {
		//todo fail fast on account level
		await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			if (Header_TabId.get() !== _tabId)
				return false;

			(patchData[`${this.getPathToObject({dbName: _dbName, itemId: _itemId})}/event`] as any) = request.event;
			return true;
		});
	};

	releaseByTabId = async () => await this.cleanNodesByTabId(Header_TabId.get());

	releaseByAccountId = async () => {
		await this.cleanNodesByAccountId(MemKey_AccountId.get());
	};

	/**
	 * Look for expired TTL nodes, clean them.
	 */
	cleanExpiredNodes = async () => {
		// Must run on all nodes.. maybe skip initiating tabId? Currently runs only after finishing to focus data
		await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			let ttl;
			switch (rootData[_dbName][_itemId][_accountId][_tabId].event) {
				case FocusEvent_Focused:
					ttl = DefaultTTL_Focus;
					break;
				case FocusEvent_Unfocused:
				default:
					ttl = DefaultTTL_Unfocus;
			}

			if (currentTimeMillis() < rootData[_dbName][_itemId][_accountId][_tabId].timestamp + ttl)
				return false;

			(patchData[this.getPathToObject({dbName: _dbName, itemId: _itemId}, _accountId, _tabId)] as any) = null;
			return true;
		});
	};
	cleanNodesByTabId = async (tabIdToClean: UniqueId) => {
		//todo fail fast on account level - this should probably not be used to handle tabs of other accounts.
		return await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			if (tabIdToClean !== _tabId)
				return false;

			(patchData[this.getPathToObject({dbName: _dbName, itemId: _itemId}, _accountId, tabIdToClean)] as any) = null;
			return true;
		});
	};

	/**
	 * Uses own accountId and tabId if not specified.
	 * @param focused dbName and itemId
	 * @param accountId receive accountId or use initiating session to get accountID
	 * @param tabId receive tabId or use initiating session to get tabID
	 */
	private getPathToObject(focused: Focused, accountId?: string, tabId?: string) {
		return `${focused.dbName}/${focused.itemId}/${accountId ?? MemKey_AccountId.get()}/${tabId ?? Header_TabId.get()}`;
	}

	getRootRef = () => ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Map>(getRelationalPath());

	cleanNodesByAccountId = async (accountIdToClean: UniqueId) => {
		//todo fail fast on account level
		await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			if (accountIdToClean !== _accountId)
				return false;

			(patchData[this.getPathToObject({dbName: _dbName, itemId: _itemId}, accountIdToClean, _tabId)] as any) = null;
			return true;
		});
	};

	/**
	 * Run over all focus data rtdb nodes
	 * @param processor Returns true if a change was made.
	 */
	processAllNodes = async (processor: (rootData: FocusData_Map, patchData: FocusData_Map, _dbName: string, _itemId: UniqueId, _accountId: UniqueId, _tabId: string) => boolean) => {
		//get root node
		const rootRef = this.getRootRef();
		const rootData = await rootRef.get({});
		const patchData: FocusData_Map = {};
		//run over all nodes, pass the indexing data to a processor function
		// DB NAME ---/ ITEM ID ---/ ACCOUNT ID ---/ TAB ID
		const somethingChanged = flatArray(
			_keys(rootData).map(_dbName => // go over all db names
				_keys(rootData[_dbName]).map(_itemId => // go over all currently focused items for each db
					_keys(rootData[_dbName][_itemId]).map(_accountId => // go over all accounts viewing an item
						_keys(rootData[_dbName][_itemId][_accountId]).map(__tabId => // go over all tabs of the specific account
							processor(rootData, patchData, _dbName as string, _itemId as string, _accountId as string, __tabId as string)))))).some(i => i);

		//set processed root node
		if (somethingChanged)
			await rootRef.patch(patchData);
	};
}

export const ModuleBE_FocusedObject = new ModuleBE_FocusedObject_Class();