import {TypedMap} from '@nu-art/ts-common';

export type FocusEvent = 'focus' | 'release';
export type FocusData_Object = {
	timestamp: number
	event: FocusEvent
}

/**
 * First layer is dbName\collection name
 * Then _id of an item in the collection
 * Then _id of the user-account
 * And only then the actual data, the focus or release timestamp
 * <p>===<p><b>dbName/objectId/userId/{timestamp, event}
 */
export type FocusData_Map = TypedMap<TypedMap<TypedMap<FocusData_Object>>>