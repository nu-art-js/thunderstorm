/*
 * ts-common — Type-strict JSON Schema for agent tool contracts
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ArrayType, MandatoryKeys, TS_Object} from '../utils/types.js';

/**
 * Wire JSON type name for T.
 * String brands (`string & {…}`) resolve as `'string'`, not `'object'`.
 */
export type JSONSchemaTypeAsString<ValueType> =
	ValueType extends readonly any[] ? 'array' :
		ValueType extends any[] ? 'array' :
			ValueType extends string ? 'string' :
				ValueType extends number ? 'number' :
					ValueType extends boolean ? 'boolean' :
						ValueType extends null | undefined | void ? 'null' :
							ValueType extends object ? 'object' :
								never;

/** Collapse brands for defaults so `JSON_Schema<string>` ≡ `JSON_Schema<Brand<string,…>>`. */
type JSONSchemaDefault<T> =
	[T] extends [string] ? string :
		[T] extends [number] ? number :
			[T] extends [boolean] ? boolean :
				T;

type JSON_ValueSchema<T> = {
	type: JSONSchemaTypeAsString<T>;
	description: string;
	default?: JSONSchemaDefault<T>;
};

type JSON_NullSchema = {};

type JSON_ArraySchema<T> = {
	items: [T] extends [readonly any[] | any[]]
		? JSON_Schema<ArrayType<T>>
		: never;
};

/** String brands share this shape — enum/default stay unbranded on the wire. */
type JSON_StringSchema = {
	enum?: readonly string[];
	pattern?: string;
};

type JSON_BooleanSchema = {};

type JSON_NumberSchema = {
	enum?: readonly number[];
	minimum?: number;
	maximum?: number;
};

type JSON_ObjectSchema<T> = {
	properties: [T] extends [TS_Object]
		? { [P in keyof T]-?: JSON_Schema<NonNullable<T[P]>> }
		: never;
	required: [T] extends [TS_Object]
		? ReadonlyArray<MandatoryKeys<T> & string>
		: never;
};

/**
 * Type-strict JSON Schema — every key of T must appear in object properties.
 * Branded strings/numbers are wire-identical to their base primitives.
 */
export type JSON_Schema<T = unknown> =
	JSON_ValueSchema<T> & (
	[T] extends [null | undefined | void] ? JSON_NullSchema :
		[T] extends [readonly any[] | any[]] ? JSON_ArraySchema<T> :
			[T] extends [string] ? JSON_StringSchema :
				[T] extends [number] ? JSON_NumberSchema :
					[T] extends [boolean] ? JSON_BooleanSchema :
						[T] extends [TS_Object] ? JSON_ObjectSchema<T> :
							never
	);

/** Agent-facing unique-id field (32-char hex). Assignable to any `JSON_Schema<string brand>`. */
export const jsonSchemaUniqueId = (description: string): JSON_Schema<string> => ({
	type: 'string',
	description,
	pattern: '^[0-9a-f]{32}$',
});
