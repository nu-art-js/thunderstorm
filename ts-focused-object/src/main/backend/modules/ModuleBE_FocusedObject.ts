import {_keys, BadImplementationException, currentTimeMillis, exists, Module, UniqueId} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {Header_TabId, MemKey_AccountId} from '@nu-art/user-account/backend';
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
	extends Module<Config> {

	protected init() {
		super.init();

		addRoutes([
			createBodyServerApi(ApiDef_FocusedObject._v1.updateFocusData, this.focusData),
			createBodyServerApi(ApiDef_FocusedObject._v1.releaseObject, this.releaseObject),
			createBodyServerApi(ApiDef_FocusedObject._v1.setFocusStatusByTabId, this.setFocusStatusByTab),
			createBodyServerApi(ApiDef_FocusedObject._v1.releaseByTabId, this.releaseByTabId),
		]);
	}

	private focusData = async (request: Request_UpdateFocusObject) => {
		const objectToWrite: FocusData_Object = {timestamp: currentTimeMillis(), event: request.event};

		const rootRef = this.getRootRef();
		const rootData = await rootRef.get({});

		request.focusData.forEach(toFocus => {
			this.createNodeIfNeeded(rootData, toFocus);
			rootData[toFocus.dbName][toFocus.itemId][MemKey_AccountId.get()][Header_TabId.get()] = objectToWrite;
		});
		await rootRef.set(rootData);

		// Clean expired
		await this.cleanExpiredNodes();
	};

	private createNodeIfNeeded(rootData: FocusData_Map, toFocus: Focused) {
		rootData[toFocus.dbName] = rootData[toFocus.dbName] ?? {};
		rootData[toFocus.dbName][toFocus.itemId] = rootData[toFocus.dbName][toFocus.itemId] ?? {};
		rootData[toFocus.dbName][toFocus.itemId][MemKey_AccountId.get()] = rootData[toFocus.dbName][toFocus.itemId][MemKey_AccountId.get()] ?? {};
	}

	releaseObject = async (request: Request_ReleaseObject) => {
		await Promise.all(request.objectsToRelease.map(async focusItem => {
			return this.setNode(undefined, focusItem.dbName, focusItem.itemId, MemKey_AccountId.get(), Header_TabId.get());
		}));
	};

	setFocusStatusByTab = async (request: Request_SetFocusStatus) => {
		await this.processAllNodes((rootData, _dbName, _itemId, _accountId, _tabId) => {
			if (Header_TabId.get() !== _tabId)
				return false;

			rootData[_dbName][_itemId][_accountId][_tabId].event = request.event;
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
		await this.processAllNodes((rootData, _dbName, _itemId, _accountId, _tabId) => {
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

			delete rootData[_dbName][_itemId][_accountId][_tabId];
			return true;
		});
	};

	cleanNodesByTabId = async (tabIdToClean: UniqueId) => {
		await this.processAllNodes((rootData, _dbName, _itemId, _accountId, _tabId) => {
			if (tabIdToClean !== _tabId)
				return false;

			delete rootData[_dbName][_itemId][_accountId][_tabId];
			return true;
		});
	};

	private setNode = async (objectToSet: FocusData_Object | undefined, _dbName: string, _itemId: UniqueId, _accountId: UniqueId, _tabId: string) => {
		if (!_dbName || !_itemId || !_accountId || !_tabId)
			throw new BadImplementationException(`Part of the focus path is undefined! '${_dbName}/${_itemId}/${_accountId}/${_tabId}/'`);

		//Prepare the rtdb ref
		const writePath = `${getRelationalPath()}${_dbName}/${_itemId}/${_accountId}/${_tabId}/`;
		//Create the ref to the right node
		const writeRef = ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Object | undefined>(writePath);

		// If the object to write is undefined/null, delete the node.
		if (!exists(objectToSet)) {
			await writeRef.delete('.*');
			return;
		}
		// If the object to write exists, write it to the node.
		return writeRef.set(objectToSet);
	};

	getRootRef = () => ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Map>(getRelationalPath());

	/**
	 * Run over all focus data rtdb nodes
	 * @param processor Returns true if a change was made.
	 */
	processAllNodes = async (processor: (rootData: FocusData_Map, _dbName: string, _itemId: UniqueId, _accountId: UniqueId, _tabId: string) => boolean) => {
		let somethingChanged: boolean = false;
		//get root node
		const rootRef = this.getRootRef();
		const rootData = await rootRef.get({});
		//run over all nodes, pass the indexing data to a processor function
		((_keys(rootData) as string[]).forEach(_dbName => {
			((_keys(rootData[_dbName]) as string[]).forEach(_itemId => {
				((_keys(rootData[_dbName][_itemId]) as string[]).forEach(_accountId => {
					((_keys(rootData[_dbName][_itemId][_accountId]) as string[]).forEach(_tabId => {
						somethingChanged ||= processor(rootData, _dbName, _itemId, _accountId, _tabId);
					}));
				}));
			}));
		}));
		//set processed root node
		if (somethingChanged)
			await rootRef.set(rootData);
	};
}

export const ModuleBE_FocusedObject = new ModuleBE_FocusedObject_Class();