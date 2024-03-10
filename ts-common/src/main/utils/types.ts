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

import {Default_UniqueKey} from '../db/types';


export type Primitive = string | number | boolean;

export type RecursiveObjectOfPrimitives = {
	[key: string]: Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives;
};

export type RecursiveArrayOfPrimitives = (Primitive | RecursiveObjectOfPrimitives | RecursiveArrayOfPrimitives)[]

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
export type SubsetKeys<AllKeys extends string | number | symbol, Mapper extends { [K in AllKeys]: any }, ExpectedType> = { [K in AllKeys]: Mapper[K] extends ExpectedType ? K : never }[AllKeys];

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

export type OptionalKeys<T extends TS_Object> = Exclude<{ [K in keyof T]: T extends Record<K, T[K]> ? never : K }[keyof T], undefined>
export type MandatoryKeys<T extends TS_Object, V = any> = Exclude<{ [K in keyof T]: T extends Record<K, T[K]> ? (T[K] extends V ? K : never) : never }[keyof T], undefined>

export type RequireOptionals<T extends TS_Object, Keys extends OptionalKeys<T> = OptionalKeys<T>> =
	Pick<T, Exclude<keyof T, Keys>>
	& { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

export type RequireOneOptional<T extends TS_Object, Keys extends OptionalKeys<T> = OptionalKeys<T>> =
	Pick<T, Exclude<keyof T, Keys>>
	& { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys]

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
	Pick<T, Exclude<keyof T, Keys>>
	& {
	[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
	Pick<T, Exclude<keyof T, Keys>>
	& {
	[K in Keys]-?:
	Required<Pick<T, K>>
	& Partial<Record<Exclude<Keys, K>, undefined>>
}[Keys]

export type Constructor<T> = new (...args: any) => T
export type ArrayType<T> = T extends (infer I)[] ? I : never;
export type NestedArrayType<T extends any[]> =
	T extends (infer I)[] ? I extends any[] ?
		NestedArrayType<I> : I : never;

export type PartialProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type KeyValue = TypedKeyValue<string, string>;
export type TypedKeyValue<KeyType, ValueType> = { key: KeyType, value: ValueType };

export type Identity = { id: string };

export type StringMap = { [s: string]: string };

export type TS_Object = { [s: string]: any };

export type TypedMap<ValueType> = { [s: string]: ValueType };

export type TypedMapValue<T extends TS_Object, ValueType> = { [P in keyof T]: ValueType };

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

export type DB_BaseObject = {
	_id: string;
}
export type DB_Object = DB_BaseObject & {
	__metadata1?: any
	__hardDelete?: boolean;
	__created: number;
	__updated: number;
	_v?: string
	_originDocId?: UniqueId;
}

export type UniqueId = string;

export type PreDB<T extends DB_Object, K extends keyof T = never> = PartialProperties<T, keyof DB_Object | K>;
export type OmitDBObject<T extends DB_Object> = Omit<T, keyof DB_Object>;

export type IndexKeys<T extends Object, Ks extends keyof T> = { [K in Ks]: T[K] };
export type UniqueParam<Type extends DB_Object, Ks extends keyof PreDB<Type> = Default_UniqueKey> =
	UniqueId
	| IndexKeys<Type, Ks>;

export type Draftable = { _isDraft: boolean };
/**
 * call function 'resolveContent(resolvableContentObject)' to receive the content which is T.
 */
export type ResolvableContent<T, K extends any[] = never> = T | ((...param: K) => T);

export type Auditable = {
	_audit?: AuditBy;
};

export type AuditBy = {
	comment?: string;
	auditBy: string;
	auditAt: Timestamp;
};

export type AuditableV2 = {
	_auditorId: string;
}

export type Timestamp = {
	timestamp: number;
	pretty: string;
	timezone?: string;
};

export type FunctionKeys<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? K : never }[keyof T];

export const Void = (() => {
})();

export type PackageJson = {
	version: string;
	name: string;
};

export type DeflatePromise<T> = T extends Promise<infer A> ? A : T

export type ReturnPromiseType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? DeflatePromise<R> : never;

export type RangeTimestamp = {
	min: number;
	max: number;
};

export type ValidReturnValue = string | number | object;

export type NarrowArray<Default, T1, T2, T3, T4, T5, T6> =
	T6 extends ValidReturnValue ? [T1, T2, T3, T4, T5, T6] :
		T5 extends ValidReturnValue ? [T1, T2, T3, T4, T5] :
			T4 extends ValidReturnValue ? [T1, T2, T3, T4] :
				T3 extends ValidReturnValue ? [T1, T2, T3] :
					T2 extends ValidReturnValue ? [T1, T2] :
						T1 extends ValidReturnValue ? [T1] : Default

export type MergeTypes<T extends unknown[]> =
	T extends [a: infer A, ...rest: infer R] ? A & MergeTypes<R> : {};

export type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export type NonEmptyArray<T> = [T, ...T[]];

export type AssetValueType<T, K extends keyof T, Ex> = T[K] extends Ex ? K : never

export type RecursiveOmit<T, OmitKey extends keyof any> = {
	[K in Exclude<keyof T, OmitKey>]: T[K] extends object ? RecursiveOmit<T[K], OmitKey> : T[K];
};

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends any[] ? T[P]
		: T[P] extends object ? RecursivePartial<T[P]>
			: T[P];
};

export type RecursiveReadonly<T> = T extends undefined ? undefined
	: T extends (infer R)[] ? ReadonlyArray<RecursiveReadonly<R>>
		: T extends object ? Readonly<{ [P in keyof T]: Readonly<T[P]> }>
			: T

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
type NonEmptyObject<T> = T extends object ? (keyof T extends never ? never : T) : never;

export type DotNotation<T extends object> =
	NonNullable<T extends object ? {
			[K in keyof T]: K extends string
				? T[K] extends object
					? NonEmptyObject<T[K]> extends never
						? T[K] extends string | string[] ? `${K & string}` : never
						: `${K & string}.${DotNotation<T[K]>}`
					: `${K & string}`
				: never;
		}[keyof T]
		: ''>;

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

export type Exact<T> = { [K in keyof T]: T[K]; } & { [K: string]: never; };

/**
 * Makes an optional property of another type mandatory.
 *
 * @typeParam T - The original type.
 * @typeParam K - The key that should be mandatory.
 * */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type AsyncVoidFunction = () => Promise<void>;