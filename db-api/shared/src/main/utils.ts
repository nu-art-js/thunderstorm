/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These utilities should be moved to a shared package.
 */


import {getDotNotatedValue, md5} from '@nu-art/ts-common';
import {DB_Object, DB_UniqueId} from './db-object.js';

/**
 * Compose a unique ID from an object's unique key fields.
 *
 * Creates a deterministic ID by joining the values of specified keys.
 * Supports dot-notation paths for nested properties (e.g. 'anchor.dbKey').
 *
 * @param obj - Object containing unique key values
 * @param keys - Array of keys (top-level or dot-notation) to use for ID composition
 * @returns Composed unique ID string
 */
export function composeDbObjectUniqueId<T extends DB_Object>(obj: T, keys: string[]): string {
	return keys.map(key => String(getDotNotatedValue(key as any, obj))).join('-');
}

/**
 * Extract the _id field from a DB object.
 */
export function dbObjectToId<T extends DB_Object<any>>(obj: T): T['_id'] {
	return obj._id;
}

/**
 * Keys that are part of DB_Object (not user-defined fields).
 */
export const KeysOfDB_Object: (keyof DB_Object)[] = ['_id', '__created', '__updated', '_v'];

export const stringToUniqueId = <DBKey extends string>(id: string) => id as DB_UniqueId<DBKey>;
export const hashToUniqueId = <DBKey extends string>(id: string) => stringToUniqueId<DBKey>(md5(id));
export const asBrandedId = stringToUniqueId;
