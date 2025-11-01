import {ArrayType, MandatoryKeys, TS_Object} from '@nu-art/ts-common';

export type JSONSchemaTypeAsString<ValueType> =
	ValueType extends readonly any[] ? 'array' :
		ValueType extends any[] ? 'array' :
			ValueType extends string ? 'string' :
				ValueType extends number ? 'number' :
					ValueType extends boolean ? 'boolean' :
						ValueType extends object ? 'object' :
							never;

type JSON_ValueSchema<T> = {
	type: JSONSchemaTypeAsString<T>;
	description: string;
	default?: T;
};

type JSON_ArraySchema<T> = {
	items: [T] extends [readonly any[] | any[]]
		? JSON_Schema<ArrayType<T>>
		: never;
};

type JSON_StringSchema<T> = {
	enum?: [T] extends [string] ? readonly T[] : never;
	pattern?: string;
};

type JSON_BooleanSchema<T> = {};

type JSON_NumberSchema<T> = {
	enum?: [T] extends [number] ? readonly T[] : never;
	minimum?: number;
	maximum?: number;
};

type JSON_ObjectSchema<T> = {
	properties: [T] extends [TS_Object]
		? { [P in keyof T]?: JSON_Schema<T[P]> }
		: never;
	required: [T] extends [TS_Object]
		? ReadonlyArray<MandatoryKeys<T> & string>
		: never;
};

export type JSON_Schema<T = unknown> =
	JSON_ValueSchema<T> & (
	[T] extends [readonly any[] | any[]] ? JSON_ArraySchema<T> :
		[T] extends [string] ? JSON_StringSchema<T> :
			[T] extends [number] ? JSON_NumberSchema<T> :
				[T] extends [boolean] ? JSON_BooleanSchema<T> :
					[T] extends [TS_Object] ? JSON_ObjectSchema<T> :
						never
	);

// Main tool type
export type TS_AgentTool<Input extends TS_Object, Output> = {
	name: string;
	inputSchema: JSON_Schema<Input>;
	execute: (args: Input) => Promise<Output>;
};
