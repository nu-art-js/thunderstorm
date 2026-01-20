import {TypeOfTypeAsString} from '../types.js';

/**
 * Metadata for a single property.
 *
 * @template ValueType - Property value type
 */
export type MetadataProperty<ValueType> = {
	/** String representation of the value type */
	valueType: TypeOfTypeAsString<ValueType>,
	/** Whether the property is optional */
	optional: boolean,
	/** Human-readable description */
	description: string

}

/**
 * Metadata for an object type (all properties required).
 *
 * @template T - Object type
 */
export type MetadataObject<T> = { [K in keyof T]-?: MetadataNested<T[K]> };

/**
 * Metadata for a nested type (handles arrays and objects recursively).
 *
 * @template T - Type to get metadata for
 */
export type MetadataNested<T> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataProperty<T> & { metadata: MetadataObject<T> } :
			MetadataProperty<T>;

/**
 * Metadata type that handles arrays, objects, and primitives.
 *
 * Recursively defines metadata for nested structures.
 *
 * @template T - Type to get metadata for
 */
export type Metadata<T> =
	T extends (infer I)[] ? MetadataProperty<T> & { metadata: Metadata<I> } :
		T extends object ? MetadataObject<T> :
			MetadataProperty<T>;
