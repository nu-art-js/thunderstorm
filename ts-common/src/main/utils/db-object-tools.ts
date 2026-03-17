import {DB_Object, OmitDBObject, SubsetObjectByKeys, TS_Object} from './types.js';
import {deepClone} from './object-tools.js';
import {exists} from './tools.js';


/** Database object property name for ID */
export const DB_OBJECT_PROP__ID = '_id';
/** Database object property name for version */
export const DB_OBJECT_PROP__VERSION = '_v';
/** Database object property name for creation timestamp */
export const DB_OBJECT_PROP__CREATED = '__created';
/** Database object property name for update timestamp */
export const DB_OBJECT_PROP__UPDATED = '__updated';
/** Array of all database object metadata keys */
export const KeysOfDB_Object: (keyof DB_Object)[] = [DB_OBJECT_PROP__ID,
																										 DB_OBJECT_PROP__VERSION,
																										 DB_OBJECT_PROP__CREATED,
																										 DB_OBJECT_PROP__UPDATED,
																										 '__metadata1'];

/**
 * Extracts the ID from a database object.
 *
 * @param i - Database object
 * @returns Object ID
 */
export function dbObjectToId(i: DB_Object) {
	return i._id;
}

/**
 * Removes database metadata keys from an object (returns a clone).
 *
 * Creates a deep clone of the object and removes all DB metadata keys
 * (_id, _v, __created, __updated, __metadata1).
 *
 * @template T - Database object type
 * @param instance - Database object
 * @returns New object without DB metadata keys
 */
export function removeDBObjectKeys<T extends DB_Object>(instance: T): OmitDBObject<T> {
	return deleteKeysObject(instance, KeysOfDB_Object);
}

/**
 * Removes database metadata keys from an object (mutates the original).
 *
 * **Note**: Mutates the original object. Use `removeDBObjectKeys()` if you
 * need a clone instead.
 *
 * @template T - Database object type
 * @param instance - Database object (will be mutated)
 * @returns Same object without DB metadata keys
 */
export function removeDBObjectKeysFromInstance<T extends DB_Object>(instance: T): OmitDBObject<T> {
	return deleteKeysObject(instance, KeysOfDB_Object, true);
}

/**
 * Removes specified keys from an object.
 *
 * By default, creates a deep clone before removing keys. If `keepInstance=true`,
 * mutates the original object instead.
 *
 * @template T - Object type
 * @template Ks - Keys to remove
 * @param instance - Object to process
 * @param keysToRemove - Array of keys to remove
 * @param keepInstance - If true, mutates original. If false, clones first (default: false)
 * @returns Object with specified keys removed
 */
export function deleteKeysObject<T extends TS_Object, Ks extends keyof T>(instance: T, keysToRemove: Ks[], keepInstance = false): Omit<T, Ks> {
	const _instance = keepInstance ? instance : deepClone(instance);
	keysToRemove.forEach(key => delete _instance[key]);
	return _instance;
}

/**
 * Keeps only database metadata keys from an object.
 *
 * Returns a new object containing only the DB metadata keys
 * (_id, _v, __created, __updated, __metadata1).
 *
 * @template T - Database object type
 * @param instance - Database object
 * @returns New object with only DB metadata keys
 */
export function keepDBObjectKeys<T extends DB_Object>(instance: T): DB_Object {
	return keepPartialObject(instance, KeysOfDB_Object);
}

/**
 * Creates a new object containing only the specified keys.
 *
 * Only includes keys that exist and are not null/undefined in the source object.
 *
 * @template T - Object type
 * @template Ks - Keys to keep
 * @param instance - Source object
 * @param keys - Array of keys to keep
 * @returns New object with only the specified keys
 */
export function keepPartialObject<T extends TS_Object, Ks extends keyof T>(instance: T, keys: Ks[]) {
	return keys.reduce((objectToRet, key) => {
		if (exists(instance[key]))
			objectToRet[key] = instance[key];

		return objectToRet;
	}, {} as SubsetObjectByKeys<T, Ks>);
}