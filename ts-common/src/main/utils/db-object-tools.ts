import {DB_Object, OmitDBObject, SubsetObjectByKeys, TS_Object} from './types';
import {deepClone} from './object-tools';
import {exists} from './tools';


export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '_v', '__created', '__updated'];

export function dbObjectToId(i: DB_Object) {
	return i._id;
}

export function removeDBObjectKeys<T extends DB_Object>(instance: T): OmitDBObject<T> {
	const _instance = deepClone(instance);
	KeysOfDB_Object.forEach(key => delete _instance[key]);
	return _instance;
}

export function deleteKeysObject<T extends DB_Object, Ks extends keyof T>(instance: T, keysToRemove: Ks[]): Omit<T, Ks> {
	const _instance = deepClone(instance);
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