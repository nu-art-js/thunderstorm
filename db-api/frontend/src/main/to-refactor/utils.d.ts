/**
 * Compose a unique ID from an object's unique key fields.
 *
 * Creates a deterministic ID by joining the values of specified keys.
 *
 * @param obj - Object containing unique key values
 * @param keys - Array of keys to use for ID composition
 * @returns Composed unique ID string
 */
export declare function composeDbObjectUniqueId<T extends object>(obj: T, keys: (keyof T)[]): string;
/**
 * Extract the _id field from a DB object.
 */
export declare function dbObjectToId<T extends {
    _id: string;
}>(obj: T): string;
