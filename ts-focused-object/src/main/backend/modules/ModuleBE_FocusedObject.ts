import {_keys, cloneObj, compare, currentTimeMillis, flatArray, Module, UniqueId} from '@thunder-storm/common';
import {addRoutes, createBodyServerApi} from '@thunder-storm/core/backend';
import {Header_DeviceId, Header_TabId, MemKey_AccountId, OnPreLogout} from '@thunder-storm/user-account/backend';
import {ModuleBE_Firebase} from '@thunder-storm/firebase/backend';
import {ApiDef_FocusedObject, FocusData_Map, FocusedEntity, FocusedItem_Update,} from '../../shared';
import {DefaultTTL_FocusedObject, getRelationalPath} from '../../shared/consts';

type Config = {}

type NodeProcessorResolution = keyof NodeProcessor;
type NodeProcessor = {
	dbKey: (dbKey: string) => boolean;
	itemId: (dbKey: string, itemId: UniqueId) => boolean;
	accountId: (dbKey: string, itemId: UniqueId, accountId: UniqueId) => boolean;
	deviceId: (dbKey: string, itemId: UniqueId, accountId: UniqueId, deviceId: UniqueId) => boolean;
	tabId: (dbKey: string, itemId: UniqueId, accountId: UniqueId, deviceId: UniqueId, tabId: UniqueId) => boolean;
}

export class ModuleBE_FocusedObject_Class
	extends Module<Config>
	implements OnPreLogout {

	__onPreLogout = async () => {
		console.log('USER LOG OUT');
		await this.onAccountLogOut();
	};

	protected init() {
		addRoutes([
			createBodyServerApi(ApiDef_FocusedObject._v1.update, this.updateFocusData)
		]);
	}

	// ######################## Callbacks ########################

	private updateFocusData = async (request: FocusedItem_Update['request']) => {
		const tabId = Header_TabId.get();
		const oldFocusMap = await this.getFocusMap();
		const newFocusMap = cloneObj(oldFocusMap);

		//Make changes to newFocusMap
		this.cleanTTL(newFocusMap);
		this.clearFocusForTabId(newFocusMap, tabId);
		this.setNewFocusData(newFocusMap, request.focusedEntities);

		//Return if there are no changes
		if (compare(oldFocusMap, newFocusMap))
			return;

		await this.setFocusMap(newFocusMap);
	};

	private onAccountLogOut = async () => {
		const deviceId = Header_DeviceId.get();
		const oldFocusMap = await this.getFocusMap();
		const newFocusMap = cloneObj(oldFocusMap);

		this.clearFocusForDeviceId(newFocusMap, deviceId);

		//Return if there are no changes
		if (compare(oldFocusMap, newFocusMap))
			return;

		await this.setFocusMap(newFocusMap);
	};

	// ######################## Logic ########################

	private getFocusMap = async () => {
		const ref = ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Map>(getRelationalPath());
		return await ref.get({});
	};

	private setFocusMap = async (map: FocusData_Map) => {
		const ref = ModuleBE_Firebase.createAdminSession().getDatabase().ref<FocusData_Map>(getRelationalPath());
		return await ref.patch(map);
	};

	private cleanTTL = (map: FocusData_Map): boolean => {
		const now = currentTimeMillis();
		return this.processNodes(map, 'tabId', (dbKey, itemId, accountId, deviceId, tabId) => {
			if (map[dbKey][itemId][accountId][deviceId][tabId] + DefaultTTL_FocusedObject >= now)
				return false;

			delete map[dbKey][itemId][accountId][deviceId][tabId];
			return true;
		});
	};

	private clearFocusForTabId = (map: FocusData_Map, _tabId: UniqueId): boolean => {
		return this.processNodes(map, 'tabId', (dbKey, itemId, accountId, deviceId, tabId) => {
			if (_tabId !== tabId)
				return false;

			delete map[dbKey][itemId][accountId][deviceId][tabId];

			// //No more entries under this deviceId
			// if (!_keys(map[dbKey][itemId][accountId][deviceId]).length)
			// 	delete map[dbKey][itemId][accountId][deviceId];
			//
			// //No more entries under this accountId
			// if (!_keys(map[dbKey][itemId][accountId]).length)
			// 	delete map[dbKey][itemId][accountId];
			//
			// //If no more entries under this itemId
			// if (_keys(map[dbKey][itemId]).length)
			// 	delete map[dbKey][itemId];
			//
			// //If no more entries under this dbKey
			// if (_keys(map[dbKey]).length)
			// 	delete map[dbKey];

			return true;
		});
	};

	private setNewFocusData = (map: FocusData_Map, focusEntities: FocusedEntity[]) => {
		const now = currentTimeMillis();
		const tabId = Header_TabId.get();
		const accountId = MemKey_AccountId.get();
		const deviceId = Header_DeviceId.get();
		focusEntities.forEach(focusEntity => {
			map[focusEntity.dbKey] ??= {};
			map[focusEntity.dbKey][focusEntity.itemId] ??= {};
			map[focusEntity.dbKey][focusEntity.itemId][accountId] ??= {};
			map[focusEntity.dbKey][focusEntity.itemId][accountId][deviceId] ??= {};
			map[focusEntity.dbKey][focusEntity.itemId][accountId][deviceId][tabId] = now;
		});
	};

	private clearFocusForDeviceId = (map: FocusData_Map, _deviceId: UniqueId) => {
		this.processNodes(map, 'deviceId', (dbKey, itemId, accountId, deviceId) => {
			if (deviceId !== _deviceId)
				return false;

			delete map[dbKey][itemId][accountId][deviceId];

			// //No more entries under this accountId
			// if (!_keys(map[dbKey][itemId][accountId]).length)
			// 	delete map[dbKey][itemId][accountId];
			//
			// //If no more entries under this itemId
			// if (_keys(map[dbKey][itemId]).length)
			// 	delete map[dbKey][itemId];
			//
			// //If no more entries under this dbKey
			// if (_keys(map[dbKey]).length)
			// 	delete map[dbKey];

			return true;
		});
	};

	// ######################## Logic - Process Nodes ########################

	private processNodes = <T extends NodeProcessorResolution>(map: FocusData_Map, resolution: T, processor: NodeProcessor[T]): boolean => {
		return flatArray(
			_keys(map).map(dbKey => { //For every dbKey
				if (resolution === 'dbKey')
					return (processor as NodeProcessor['dbKey'])(dbKey as string);

				return _keys(map[dbKey]).map(itemId => { //For every itemId
					if (resolution === 'itemId')
						return (processor as NodeProcessor['itemId'])(dbKey as string, itemId as string);

					return _keys(map[dbKey][itemId]).map(accountId => { //For every accountId
						if (resolution === 'accountId')
							return (processor as NodeProcessor['accountId'])(dbKey as string, itemId as string, accountId as string);

						return _keys(map[dbKey][itemId][accountId]).map(deviceId => {  //For every deviceId
							if (resolution === 'deviceId')
								return (processor as NodeProcessor['deviceId'])(dbKey as string, itemId as string, accountId as string, deviceId as string);

							return _keys(map[dbKey][itemId][accountId][deviceId]).map(tabId => //For every tabId
								processor(dbKey as string, itemId as string, accountId as string, deviceId as string, tabId as string)
							);
						});
					});
				});
			})
		).some(i => i);
	};
}

export const ModuleBE_FocusedObject = new ModuleBE_FocusedObject_Class();