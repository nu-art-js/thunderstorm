import {DB_Object, OmitDBObject, SubsetObjectByKeys, TS_Object} from './types';
import {deepClone} from './object-tools';
import {exists} from './tools';


export const DB_OBJECT_PROP__ID = '_id';
export const DB_OBJECT_PROP__VERSION = '_v';
export const DB_OBJECT_PROP__CREATED = '__created';
export const DB_OBJECT_PROP__UPDATED = '__updated';
export const KeysOfDB_Object: (keyof DB_Object)[] = [DB_OBJECT_PROP__ID, DB_OBJECT_PROP__VERSION, DB_OBJECT_PROP__CREATED, DB_OBJECT_PROP__UPDATED, '__metadata1'];

export function dbObjectToId(i: DB_Object) {
	return i._id;
}

export function removeDBObjectKeys<T extends DB_Object>(instance: T): OmitDBObject<T> {
	return deleteKeysObject(instance, KeysOfDB_Object);
}

export function removeDBObjectKeysFromInstance<T extends DB_Object>(instance: T): OmitDBObject<T> {
	return deleteKeysObject(instance, KeysOfDB_Object, true);
}

/**
 * Returns a cloned object with the keys removed.
 */
export function deleteKeysObject<T extends TS_Object, Ks extends keyof T>(instance: T, keysToRemove: Ks[], keepInstance = false): Omit<T, Ks> {
	const _instance = keepInstance ? instance : deepClone(instance);
	keysToRemove.forEach(key => delete _instance[key]);
	return _instance;
}

export function keepDBObjectKeys<T extends DB_Object>(instance: T): DB_Object {
	return keepPartialObject(instance, KeysOfDB_Object);
}

export function keepPartialObject<T extends TS_Object, Ks extends keyof T>(instance: T, keys: Ks[]) {
	return keys.reduce((objectToRet, key) => {
		if (exists(instance[key]))
			objectToRet[key] = instance[key];

		return objectToRet;
	}, {} as SubsetObjectByKeys<T, Ks>);
}