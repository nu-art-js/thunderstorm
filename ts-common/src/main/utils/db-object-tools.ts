import {DB_Object, OmitDBObject} from './types';
import {deepClone, filterKeys} from './object-tools';


export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '_v', '__created', '__updated'];

export function dbObjectToId(i: DB_Object) {
	return i._id;
}

export function removeDBObjectKeys<T extends DB_Object>(instance: T): OmitDBObject<T> {
	const _instance = deepClone(instance);
	return filterKeys(_instance, KeysOfDB_Object);
}