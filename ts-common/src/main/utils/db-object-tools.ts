import {DB_Object} from './types';


export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '_v', '__created', '__updated'];

export function dbObjectToId(i: DB_Object) {
	return i._id;
}
