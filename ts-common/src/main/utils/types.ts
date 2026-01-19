/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Default_UniqueKey} from '../db/types.js';


export type Primitive = string | number | boolean;

export type RecursiveObjectOfPrimitives = {
	[key: string]: Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives | undefined;
};

export type RecursiveArrayOfPrimitives = (Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives)[]

export type AnyPrimitive = Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives;

export type CustomOptional<T, K> = {
	[P in keyof T]?: K
};

export type Subset<T> = {
	[P in keyof T]: T[P];
};

/**
 * Utility type for creating a subset of keys (`AllKeys`) based on whether the corresponding value types in a mapping object (`Mapper`) extend a certain type (`ExpectedType`).
 *
 * @typeParam AllKeys - Represents all possible keys. Must be a string, a number, or a union of string and/or number literals.
 * @typeParam Mapper - Represents a mapping object. Must be an object type with keys that are a subset of AllKeys and values of any type.
 * @typeParam ExpectedType - Represents the type that the values in the Mapper object should extend.
 *
 * @example
 * type Keys = 'a' | 'b' | 'c' | 'd';
 * type MyMapper = { a: number, b: string, c: boolean, d: number };
 * type MySubsetKeys = SubsetKeys<Keys, MyMapper, number>; // 'a' | 'd'
 */
export type SubsetKeys<AllKeys extends string | number | symbol, Mapper extends { [K in AllKeys]: any }, ExpectedType> = {
	[K in AllKeys]: Mapper[K] extends ExpectedType
		? K
		: never
}[AllKeys];

/**
 * Utility type to generate a new type `T` where only the properties with keys listed in `Keys` are included.
 * The resulting type will be a new object type with a subset of the properties from the original `T`.
 *
 * @typeParam T - The type from which the subset will be generated.
 * @typeParam Keys - A set of keys from `T` which will be included in the new subset type.
 *
 * @example
 * type MyType = { a: number, b: string, c: boolean, d: number };
 * type MySubset = SubsetByKeys<MyType, 'a' | 'd'>; // { a: number, d: number }
 */
export type SubsetObjectByKeys<T, Keys extends keyof T> = {
	[K in Keys]: T[K];
};

/**
 * Utility type to generate a subset of keys from a type `T` where the corresponding value type extends `ExpectedType`.
 * It uses the `SubsetKeys` to get the subset of keys and `SubsetByKeys` to create a new type with only the properties that have those keys.
 *
 * @typeParam T - The type from which the subset of keys will be generated.
 * @typeParam ExpectedType - The type that the values in `T` should extend.
 *
 * @example
 * type MyType = { a: number, b: string, c: boolean, d: number };
 * type MySubset = SubsetByValueType<MyType, number> // { a: number, d: number }
 */
export type SubsetObjectByValue<T, ExpectedType> = SubsetObjectByKeys<T, SubsetKeys<keyof T, T, ExpectedType>>;

/**
 * Extracts optional keys from a type.
 *
 * Returns a union of all keys that are optional in the type.
 *
 * @template T - Object type
 */
export type OptionalKeys<T extends TS_Object> = Exclude<{ [K in keyof T]: T extends Record<K, T[K]> ? never : K }[keyof T], undefined>

/**
 * Extracts mandatory keys from a type that match a value type.
 *
 * Returns keys that are required AND have values extending the specified type.
 *
 * @template T - Object type
 * @template V - Value type to filter by
 */
export type MandatoryKeys<T extends TS_Object, V = any> = Exclude<{
	[K in keyof T]: T extends Record<K, T[K]>
		? (T[K] extends V ? K : never)
		: never
}[keyof T], undefined>

/**
 * Makes all optional keys required.
 *
 * @template T - Object type
 * @template Keys - Optional keys to require (default: all optional keys)
 */
export type RequireOptionals<T extends TS_Object, Keys extends OptionalKeys<T> = OptionalKeys<T>> =
	Pick<T, Exclude<keyof T, Keys>>
	& { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

/**
 * Requires exactly one of the optional keys to be present.
 *
 * @template T - Object type
 * @template Keys - Optional keys (default: all optional keys)
 */
export type RequireOneOptional<T extends TS_Object, Keys extends OptionalKeys<T> = OptionalKeys<T>> =
	Pick<T, Exclude<keyof T, Keys>>
	& { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys]

/**
 * Requires at least one of the specified keys to be present.
 *
 * @template T - Object type
 * @template Keys - Keys to require at least one of (default: all keys)
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
	Pick<T, Exclude<keyof T, Keys>>
	& {
	[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

/**
 * Requires exactly one of the specified keys to be present.
 *
 * All other specified keys must be undefined.
 *
 * @template T - Object type
 * @template Keys - Keys to require exactly one of (default: all keys)
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
	Pick<T, Exclude<keyof T, Keys>>
	& {
	[K in Keys]-?:
	Required<Pick<T, K>>
	& Partial<Record<Exclude<Keys, K>, undefined>>
}[Keys]

/** Constructor type for a class */
export type Constructor<T> = new (...args: any) => T

/** Constructor type for a class */
export type AbstractConstructor<T> = abstract new (...args: any) => T

/** Constructor type for a class */
export type AnyConstructor<T> = AbstractConstructor<T> | Constructor<T>

/** Extracts the element type from an array type */
export type ArrayType<T> = T extends (infer I)[] ? I : never;

/**
 * Extracts the innermost element type from nested arrays.
 *
 * Recursively unwraps array types until reaching a non-array type.
 *
 * @template T - Nested array type
 */
export type NestedArrayType<T extends any[]> =
	T extends (infer I)[] ? I extends any[] ?
		NestedArrayType<I> : I : never;

/**
 * Makes specified properties optional while keeping others required.
 *
 * @template T - Object type
 * @template K - Keys to make optional
 */
export type PartialProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Key-value pair with string key and string value */
export type KeyValue = TypedKeyValue<string, string>;

/**
 * Typed key-value pair.
 *
 * @template KeyType - Key type
 * @template ValueType - Value type
 */
export type TypedKeyValue<KeyType, ValueType> = { key: KeyType, value: ValueType };

/** Object with an id field */
export type Identity = { id: string };

/** Map with string keys and string values */
export type StringMap = { [s: string]: string };

/** Generic object type (any properties) */
export type TS_Object = { [s: string]: any };

/**
 * Map with string keys and typed values.
 *
 * @template ValueType - Value type for all entries
 */
export type TypedMap<ValueType> = { [s: string]: ValueType };

/**
 * Transforms all properties of an object to a single value type.
 *
 * @template T - Object type
 * @template ValueType - Target value type
 */
export type TypedMapValue<T extends TS_Object, ValueType> = { [P in keyof T]: ValueType };

/**
 * Type that requires at least the specified keys, with others optional.
 *
 * @template T - Object type
 * @template K - Required keys
 */
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Base database object with just the ID field.
 */
export type DB_BaseObject = {
	_id: string;
}

/**
 * Full database object with all metadata fields.
 *
 * Includes versioning, timestamps, and optional metadata.
 */
export type DB_Object = DB_BaseObject & {
	/** Optional application-level metadata */
	__metadata1?: any
	/** Hard delete flag (soft delete alternative) */
	__hardDelete?: boolean;
	/** Creation timestamp (milliseconds) */
	__created: number;
	/** Last update timestamp (milliseconds) */
	__updated: number;
	/** Version string (semantic version) */
	_v?: string
	/** Original document ID (for versioning/cloning) */
	_originDocId?: UniqueId;
}

/** Unique identifier type (string) */
export type UniqueId = string;

/**
 * Database pointer (reference to another database object).
 *
 * Contains the database key (collection name) and object ID.
 */
export type DBPointer = { dbKey: string; id: UniqueId };

/**
 * Pre-database type (object before DB metadata is added).
 *
 * Removes DB metadata keys and optionally other specified keys.
 *
 * @template T - Database object type
 * @template K - Additional keys to remove
 */
export type PreDB<T extends DB_Object, K extends keyof T = never> = PartialProperties<T, keyof DB_Object | K>;

/**
 * Removes all database metadata keys from a type.
 *
 * @template T - Database object type
 */
export type OmitDBObject<T extends DB_Object> = Omit<T, keyof DB_Object>;

/**
 * Index keys type for querying by indexed fields.
 *
 * Allows querying by any combination of indexed keys.
 *
 * @template T - Object type
 * @template Ks - Indexed keys
 */
export type IndexKeys<T extends Object, Ks extends keyof T> = { [K in Ks]?: T[K] }; // {_id:'all bases belong to us'} || {label: 'all items with this label'}

/**
 * Unique parameter type for database queries.
 *
 * Can be either a unique ID string or an object with indexed keys.
 *
 * @template Type - Database object type
 * @template Ks - Unique keys (default: '_id')
 */
export type UniqueParam<Type extends DB_Object, Ks extends keyof PreDB<Type> = Default_UniqueKey> =
	UniqueId
	| IndexKeys<Type, Ks>;

/** Object that can be in draft state */
export type Draftable = { _isDraft: boolean };

/**
 * Content that can be either a value or a function that returns a value.
 *
 * Use `resolveContent()` to resolve to the actual value.
 *
 * @template T - Value type
 * @template K - Function parameter types
 */
export type ResolvableContent<T, K extends any[] = any[]> = T | ((...param: K) => T);

/**
 * Extracts the resolved type from ResolvableContent.
 *
 * @template T - ResolvableContent type
 */
export type ResolvedContent<T extends ResolvableContent<any, any>> = T extends ResolvableContent<infer R, any> ? R : never;

/**
 * Object with audit trail information.
 */
export type Auditable = {
	/** Optional audit information */
	_audit?: AuditBy;
};

/**
 * Audit information for tracking who/when changes were made.
 */
export type AuditBy = {
	/** Optional comment about the change */
	comment?: string;
	/** ID of the user/system that made the change */
	auditBy: string;
	/** Timestamp of the change */
	auditAt: Timestamp;
};

/**
 * Simplified audit information (v2).
 *
 * Only stores the auditor ID, not full audit details.
 */
export type AuditableV2 = {
	/** ID of the user/system that made the change */
	_auditorId: string;
}

/**
 * Timestamp with formatted string representation.
 */
export type Timestamp = {
	/** Numeric timestamp (milliseconds) */
	timestamp: number;
	/** Human-readable formatted string */
	pretty: string;
	/** Optional timezone information */
	timezone?: string;
};

/**
 * Extracts keys from a type that are functions.
 *
 * @template T - Object type
 */
export type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? K : never }[keyof T];

/**
 * Void value constant (undefined, but typed as void).
 *
 * Useful for type-safe void values in generic contexts.
 */
export const Void = (() => {
})();

/**
 * Package.json structure (minimal).
 */
export type PackageJson = {
	version: string;
	name: string;
};

/**
 * Unwraps a Promise type to get the resolved value type.
 *
 * If T is a Promise, returns the inner type. Otherwise returns T.
 *
 * @template T - Type that may be a Promise
 */
export type DeflatePromise<T> = T extends Promise<infer A> ? A : T

/**
 * Extracts the return type from a function, unwrapping Promises.
 *
 * Gets the function's return type and unwraps it if it's a Promise.
 *
 * @template T - Function type
 */
export type ReturnPromiseType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? DeflatePromise<R> : never;

/**
 * Timestamp range with min and max values.
 */
export type RangeTimestamp = {
	min: number;
	max: number;
};

/** Valid return value types for NarrowArray */
export type ValidReturnValue = string | number | object;

/**
 * Narrows an array type to the longest valid prefix.
 *
 * Returns the longest array type where all elements are ValidReturnValue.
 * If none are valid, returns Default.
 *
 * @template Default - Default type if no valid elements
 * @template T1-T6 - Element types to check
 */
export type NarrowArray<Default, T1, T2, T3, T4, T5, T6> =
	T6 extends ValidReturnValue ? [T1, T2, T3, T4, T5, T6] :
		T5 extends ValidReturnValue ? [T1, T2, T3, T4, T5] :
			T4 extends ValidReturnValue ? [T1, T2, T3, T4] :
				T3 extends ValidReturnValue ? [T1, T2, T3] :
					T2 extends ValidReturnValue ? [T1, T2] :
						T1 extends ValidReturnValue ? [T1] : Default

/**
 * Merges multiple types into a single intersection type.
 *
 * Recursively merges all types in the array into one type.
 *
 * @template T - Array of types to merge
 */
export type MergeTypes<T extends unknown[]> =
	T extends [a: infer A, ...rest: infer R] ? A & MergeTypes<R> : {};

/**
 * Converts a union type to an intersection type.
 *
 * Uses conditional type distribution to transform U | V into U & V.
 *
 * @template U - Union type
 */
export type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

/**
 * Array type that guarantees at least one element.
 *
 * @template T - Element type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Extracts keys from a type where the value extends a specific type.
 *
 * @template T - Object type
 * @template K - Key to check
 * @template Ex - Expected value type
 */
export type AssetValueType<T, K extends keyof T, Ex> = T[K] extends Ex ? K : never

/**
 * Recursively omits a key from an object type and all nested objects.
 *
 * @template T - Object type
 * @template OmitKey - Key to omit recursively
 */
export type RecursiveOmit<T, OmitKey extends keyof any> = {
	[K in Exclude<keyof T, OmitKey>]: T[K] extends object ? RecursiveOmit<T[K], OmitKey> : T[K];
};

/**
 * Recursively makes all properties optional.
 *
 * Applies Partial recursively to nested objects, but preserves arrays as-is.
 *
 * @template T - Type to make recursively partial
 */
export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends any[] ? T[P]
		: T[P] extends object ? RecursivePartial<T[P]>
			: T[P];
};

/**
 * Recursively makes all properties readonly.
 *
 * Applies Readonly recursively to nested objects and arrays.
 *
 * @template T - Type to make recursively readonly
 */
export type RecursiveReadonly<T> = T extends undefined ? undefined
	: T extends (infer R)[] ? ReadonlyArray<RecursiveReadonly<R>>
		: T extends object ? Readonly<{ [P in keyof T]: Readonly<T[P]> }>
			: T

/**
 * Recursively removes readonly modifiers.
 *
 * Converts Readonly types back to mutable types recursively.
 *
 * @template T - Type to make recursively writable
 */
export type RecursiveWritable<T> =
	T extends ReadonlyArray<infer R> ? RecursiveWritable<R>[] :
		T extends object ? { -readonly [P in keyof T]: RecursiveWritable<T[P]> } :
			T;
/**
 * Constructs a union of string paths representing the properties and nested properties of an object type.
 *
 * @typeParam ObjectType - The object type to analyze.
 *
 * @example
 * // Simple Example: Analyzing a flat object
 * type Person = { name: string; age: number };
 * type PersonPaths = DotNotation<Person>; // 'name' | 'age'
 *
 * @example
 * // Nested Example: Analyzing an object with nested properties
 * type User = { name: string; address: { city: string; zip: string } };
 * type UserPaths = DotNotation<User>; // 'name' | 'address' | 'address.city' | 'address.zip'
 *
 * @example
 * // Complex Example: Analyzing an object with multiple levels of nesting
 * type Profile = { name: string; contacts: { email: { primary: string; secondary: string } } };
 * type ProfilePaths = DotNotation<Profile>; // 'name' | 'contacts' | 'contacts.email' | 'contacts.email.primary' | 'contacts.email.secondary'
 */
export type DotNotation<T extends object> = {
	[K in keyof T]-?: K extends string
		? NonNullable<T[K]> extends string | string[]
			? K
			: NonNullable<T[K]> extends object
				? `${K}.${DotNotation<NonNullable<T[K]>>}`
				: never
		: never
}[keyof T];

/**
 * Replaces the type of nested property within an object, based on a specified path.
 *
 * @typeParam ObjectType - The original object type.
 * @typeParam PropertyPath - The path to the property to replace, expressed as a dot-notation string.
 * @typeParam NewValueType - The new type to replace the old type with.
 *
 * @example
 * // Simple Example: Replace the 'age' property with a string
 * type Person = { name: string; age: number };
 * type NewPerson = ManipulateInnerPropValue<Person, 'age', string>;
 * // Result: { name: string; age: string }
 *
 * @example
 * // Nested Example: Replace the 'address.city' property with a number
 * type User = { name: string; address: { city: string; zip: string } };
 * type NewUser = ManipulateInnerPropValue<User, 'address.city', number>;
 * // Result: { name: string; address: { city: number; zip: string } }
 *
 * @example
 * // Complex Example: Replace the 'contacts.email.primary' property with a boolean
 * type Profile = { name: string; contacts: { email: { primary: string; secondary: string } } };
 * type NewProfile = ManipulateInnerPropValue<Profile, 'contacts.email.primary', boolean>;
 * // Result: { name: string; contacts: { email: { primary: boolean; secondary: string } } }
 */
export type ManipulateInnerPropValue<ObjectType extends object, PropertyPath extends DotNotation<ObjectType>, NewValueType> =
	PropertyPath extends `${infer Key}.${infer Rest}`
		? Key extends keyof ObjectType
			? {
				[Prop in keyof ObjectType]: Prop extends Key
					? ObjectType[Key] extends object
						? Rest extends DotNotation<ObjectType[Key]>
							? ManipulateInnerPropValue<ObjectType[Key], Rest, NewValueType>
							: never
						: ObjectType[Prop]
					: never
			}
			: never
		: { [Prop in keyof ObjectType]: Prop extends PropertyPath ? NewValueType : ObjectType[Prop] };

export type DotNotationValueType<ObjectType extends object, Path extends string> = Path extends `${infer First}.${infer Rest}`
	? First extends keyof ObjectType
		? NonNullable<ObjectType[First]> extends object
			? DotNotationValueType<NonNullable<ObjectType[First]>, Rest>
			: never
		: never
	: Path extends keyof ObjectType
		? NonNullable<ObjectType[Path]>
		: never;

/**
 * Creates an exact type that prevents extra properties.
 *
 * Ensures the type matches exactly - no additional string keys allowed.
 *
 * @template T - Type to make exact
 */
export type Exact<T> = { [K in keyof T]: T[K]; } & { [K: string]: never; };

/**
 * Makes an optional property of another type mandatory.
 *
 * @template T - The original type
 * @template K - The key that should be mandatory
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * Async function that returns a Promise.
 *
 * @template T - Return type (default: void)
 */
export type AsyncVoidFunction<T = void> = () => Promise<T>;

/** Unique symbol for type branding */
declare const brand: unique symbol;

/**
 * Brands a type with a unique identifier.
 *
 * Creates a nominal type from a structural type, preventing accidental
 * mixing of types that have the same structure but different meanings.
 *
 * @template T - Base type
 * @template Brand - Brand identifier string
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * type ProductId = Brand<string, 'ProductId'>;
 * // UserId and ProductId are not compatible even though both are strings
 * ```
 */
export type Brand<T, Brand extends string> = T & { [brand]: Brand }

/** Branded type for relative file paths */
export type RelativePath = Brand<string, 'RelativePath'>;
/** Branded type for absolute file paths */
export type AbsolutePath = Brand<string, 'AbsolutePath'>;