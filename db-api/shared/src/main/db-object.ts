type Brand<T, B extends string> = T & { readonly __brand: B };

export type DB_UniqueId<Key extends string> = Brand<string, `id:${Key}`>

/**
 * Database key type with bound id brand.
 *
 * The id brand is automatically derived from the db key, ensuring type safety.
 * An id branded as `id:user` can only be used with db key `user`.
 *
 * @template Key - The database key (collection name)
 */
export type DB_Key<Key extends string> = {
	id: DB_UniqueId<Key>
	key: Key
};

/**
 * Base database object with just the ID field.
 *
 * @template Key - The database key (collection name)
 */
export type DB_BaseObject<Key extends string = string> = {
	_id: DB_UniqueId<Key>;
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
 * Branded database pointer (`dbKey` + correlated `DB_UniqueId`).
 *
 * Distributes over key unions so narrowing `dbKey` also narrows `id`:
 * `DBPointer<'docs' | 'tasks'>` ≡ `DBPointer<'docs'> | DBPointer<'tasks'>`.
 *
 * Prefer a concrete key or a closed key union — `DBPointer<string>` erases the brand.
 *
 * @template Key - The database key (collection name)
 */
export type DBPointer<Key extends string> = Key extends infer K extends string
	? { dbKey: K; id: DB_UniqueId<K> }
	: never;


/** @deprecated Unique identifier type (string) - should be replaced by a branded DB_Key<Key>['id'] and the generic version of it is DB_Key['id']*/
export type UniqueId = string;


/**
 * Removes all database metadata keys from a type.
 *
 * @template T - Database object type
 */
export type OmitDBObject<T extends DB_Object> = Omit<T, keyof DB_Object>;

/** Default unique key name for database objects */
export type Default_UniqueKey = '_id';
