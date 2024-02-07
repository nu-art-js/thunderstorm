import {TypedMap, UniqueId} from '@nu-art/ts-common';

type TabId_Map<T> = TypedMap<T>
type AccountId_Map<T> = TypedMap<T>
type ItemId_Map<T> = TypedMap<T>
type DbName_Map<T> = TypedMap<T>

export type FocusEvent = 'focus' | 'unfocused';
export type FocusData_Object = {
	timestamp: number
	event: FocusEvent
}

/**
 * First layer is dbName\collection name
 * Then _id of an item in the collection
 * Then _id of the user-account
 * And only then the actual data, the focus or release timestamp
 * <p>===<p><b>dbName/objectId/accountId/tabUd/{timestamp, event}
 */
export type FocusData_Map = DbName_Map<ItemId_Map<AccountId_Map<TabId_Map<FocusData_Object>>>>

export type Focused = {
	dbName: string
	itemId: UniqueId
};