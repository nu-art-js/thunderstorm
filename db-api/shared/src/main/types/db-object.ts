type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Database key type with bound id brand.
 *
 * The id brand is automatically derived from the db key, ensuring type safety.
 * An id branded as `id:user` can only be used with db key `user`.
 *
 * @template Key - The database key (collection name)
 */
export type DB_Key<Key extends string> = {
	id: Brand<string, `id:${Key}`>
	key: Key
};

/**
 * Base database object with just the ID field.
 *
 * @template Key - The database key (collection name)
 */
export type DB_BaseObject<Key extends string = string> = {
	_id: DB_Key<Key>['id'];
}

/**
 * Full database object with all metadata fields.
 *
 * Includes versioning, timestamps, and optional metadata.
 *
 * @template Key - The database key (collection name)
 */
export type DB_Object<Key extends string = string> = DB_BaseObject<Key> & {
	/** Creation timestamp (milliseconds) */
	__created: number;
	/** Last update timestamp (milliseconds) */
	__updated: number;
	/** Version string (semantic version) */
	_v: string
}

/**
 * Database pointer (reference to another database object).
 *
 * Contains the database key (collection name) and object ID.
 *
 * @template Key - The database key (collection name)
 */
export type DBPointer<Key extends string> = { dbKey: DB_Key<Key>['key']; id: DB_Key<Key>['id'] };
