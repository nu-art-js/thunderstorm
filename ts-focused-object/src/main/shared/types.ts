import {TypedMap, UniqueId} from '@nu-art/ts-common';

type TabId_Map<T> = TypedMap<T>
type DeviceId_Map<T> = TypedMap<T>;
type AccountId_Map<T> = TypedMap<T>
type ItemId_Map<T> = TypedMap<T>
type DbName_Map<T> = TypedMap<T>

/**
 * First layer is dbKey.<br>
 * Then _id of an item in the collection.<br>
 * Then _id of the user-account.<br>
 * Then the id of the device, as we can have multiple devices for each account.<br>
 * Then the id of the tab, as we can have multiple tabs across each device.<br>
 * And only then the actual data, which is a timestamp (number)<br>
 * <p>===<p><b>dbName / objectId / accountId / deviceId / tabId / timestamp
 */
export type FocusData_Map = DbName_Map<ItemId_Map<AccountId_Map<DeviceId_Map<TabId_Map<number>>>>>;

export type FocusedEntity = {
	dbKey: string
	itemId: UniqueId
};