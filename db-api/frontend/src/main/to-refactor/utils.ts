/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These utilities should be moved to a shared package.
 */


/**
 * Compose a unique ID from an object's unique key fields.
 *
 * Creates a deterministic ID by joining the values of specified keys.
 *
 * @param obj - Object containing unique key values
 * @param keys - Array of keys to use for ID composition
 * @returns Composed unique ID string
 */
export function composeDbObjectUniqueId<T extends object>(obj: T, keys: (keyof T)[]): string {
	return keys.map(key => String(obj[key])).join('-');
}

/**
 * Extract the _id field from a DB object.
 */
export function dbObjectToId<T extends { _id: string }>(obj: T): string {
	return obj._id;
}
