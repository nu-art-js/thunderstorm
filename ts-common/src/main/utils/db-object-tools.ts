import {DB_Object, OmitDBObject} from './types';
import {deepClone} from './object-tools';


export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '_v', '__created', '__updated'];

export function dbObjectToId(i: DB_Object) {
	return i._id;
}

export function removeDBObjectKeys<T extends DB_Object>(instance: T): OmitDBObject<T> {
	const _instance = deepClone(instance);
	KeysOfDB_Object.forEach(key => delete _instance[key]);
	return _instance;
}