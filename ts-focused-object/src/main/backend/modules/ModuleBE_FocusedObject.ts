import {_keys, currentTimeMillis, Module, UniqueId} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {Header_TabId, MemKey_AccountId, OnPreLogout} from '@nu-art/user-account/backend';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {
	ApiDef_FocusedObject,
	FocusData_Map,
	FocusData_Object,
	Focused,
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
		await this.releaseByTabId();
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
		request.objectsToRelease.forEach(focusItem => {
			(patchData[this.getPathToObject(focusItem)] as any) = null;
		});
		const rootRef = this.getRootRef();
		await rootRef.patch(patchData);
	};

	setFocusStatusByTab = async (request: Request_SetFocusStatus) => {
		await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			if (Header_TabId.get() !== _tabId)
				return false;

			(patchData[`${this.getPathToObject({dbName: _dbName, itemId: _itemId})}/event`] as any) = request.event;
			return true;
		});
	};

	releaseByTabId = async () => {
		await this.cleanNodesByTabId(Header_TabId.get());
	};

	/**
	 * Look for expired TTL nodes, clean them.
	 */
	cleanExpiredNodes = async () => {
		await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			let ttl;
			switch (rootData[_dbName][_itemId][_accountId][_tabId].event) {
				case 'focus':
					ttl = DefaultTTL_Focus;
					break;
				case 'unfocused':
				default:
					ttl = DefaultTTL_Unfocus;
			}

			if (currentTimeMillis() < rootData[_dbName][_itemId][_accountId][_tabId].timestamp + ttl)
				return false;

			(patchData[this.getPathToObject({dbName: _dbName, itemId: _itemId})] as any) = null;
			return true;
		});
	};
	cleanNodesByTabId = async (tabIdToClean: UniqueId) => {
		return await this.processAllNodes((rootData, patchData, _dbName, _itemId, _accountId, _tabId) => {
			if (tabIdToClean !== _tabId)
				return false;

			(patchData[this.getPathToObject({dbName: _dbName, itemId: _itemId}, tabIdToClean)] as any) = null;
			return true;
		});
	};

	private getPathToObject(focused: Focused, tabId?: string) {
		return `${focused.dbName}/${focused.itemId}/${MemKey_AccountId.get()}/${tabId ?? Header_TabId.get()}`;
	}

	getRootRef = () => ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Map>(getRelationalPath());

	/**
	 * Run over all focus data rtdb nodes
	 * @param processor Returns true if a change was made.
	 */
	processAllNodes = async (processor: (rootData: FocusData_Map, patchData: FocusData_Map, _dbName: string, _itemId: UniqueId, _accountId: UniqueId, _tabId: string) => boolean) => {
		let somethingChanged: boolean = false;
		//get root node
		const rootRef = this.getRootRef();
		const rootData = await rootRef.get({});
		const patchData: FocusData_Map = {};
		//run over all nodes, pass the indexing data to a processor function
		await Promise.all(((_keys(rootData) as string[]).map(async _dbName => {
			await Promise.all(((_keys(rootData[_dbName]) as string[]).map(async _itemId => {
				await Promise.all(((_keys(rootData[_dbName][_itemId]) as string[]).map(async _accountId => {
					await Promise.all(((_keys(rootData[_dbName][_itemId][_accountId]) as string[]).map(async _tabId => {
						//pass rootData in-case existing data needs to be queried, pass patchData to be filled with updates.
						somethingChanged ||= processor(rootData, patchData, _dbName, _itemId, _accountId, _tabId);
					})));
				})));
			})));
		})));

		//set processed root node
		if (somethingChanged)
			await rootRef.patch(patchData);
	};
}

export const ModuleBE_FocusedObject = new ModuleBE_FocusedObject_Class();