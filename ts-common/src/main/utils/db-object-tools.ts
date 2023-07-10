import {DB_Object, OmitDBObject} from './types';
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

export function keepDBObjectKeys<T extends DB_Object>(instance: T): DB_Object {
	return KeysOfDB_Object.reduce<DB_Object>((objectToRet, key) => {
		if (exists(instance[key]))  // @ts-ignore
			objectToRet[key] = instance[key];

		return objectToRet;
	}, {} as DB_Object);
}