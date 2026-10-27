/*
 * ts-common — Runtime JSON schema document check and instance check
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {CustomException} from '../core/exceptions/exceptions.js';

const NodeKeys = new Set([
	'type',
	'description',
	'enum',
	'minLength',
	'maxLength',
	'pattern',
	'properties',
	'required',
	'items',
	'additionalProperties',
]);
const AllowedKeywords = 'type, properties, required, items, additionalProperties, minLength, maxLength, pattern, enum, description';

export type JsonSchemaScalarType = 'string' | 'number' | 'integer' | 'boolean';

export type JsonSchemaScalar = {
	type: JsonSchemaScalarType;
	description?: string;
	enum?: readonly (string | number | boolean)[];
	pattern?: string;
	minLength?: number;
	maxLength?: number;
};

export type JsonSchemaArray = {
	type: 'array';
	description?: string;
	items: JsonSchemaDocument;
};

export type JsonSchemaObject = {
	type: 'object';
	description?: string;
	properties: Record<string, JsonSchemaDocument>;
	required?: readonly string[];
	additionalProperties?: boolean;
};

/** A schema document an agent can send. Field description and enum are part of it. */
export type JsonSchemaDocument = JsonSchemaScalar | JsonSchemaArray | JsonSchemaObject;

export class JsonSchemaException
	extends CustomException {
	readonly kind: 'schema' | 'instance';

	constructor(kind: 'schema' | 'instance', message: string) {
		super(JsonSchemaException, message);
		this.kind = kind;
	}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

function fail(kind: 'schema' | 'instance', message: string): never {
	throw new JsonSchemaException(kind, message);
}

const readDescription = (value: unknown, path: string): string | undefined => {
	if (value === undefined)
		return undefined;
	if (typeof value !== 'string' || value.trim().length === 0)
		fail('schema', `${path}.description is a non-empty string`);

	return value;
};

const readEnum = (value: unknown, type: JsonSchemaScalarType, path: string): readonly (string | number | boolean)[] | undefined => {
	if (value === undefined)
		return undefined;
	if (!Array.isArray(value) || value.length === 0)
		fail('schema', `${path}.enum lists at least one value`);

	const entries: (string | number | boolean)[] = [];
	for (const entry of value) {
		if (!enumEntryMatches(type, entry))
			fail('schema', `${path}.enum values are ${type === 'integer' ? 'integers' : `${type}s`}`);
		entries.push(entry);
	}
	return entries;
};

const enumEntryMatches = (type: JsonSchemaScalarType, entry: unknown): entry is string | number | boolean => {
	if (type === 'string')
		return typeof entry === 'string';
	if (type === 'boolean')
		return typeof entry === 'boolean';
	if (typeof entry !== 'number' || !Number.isFinite(entry))
		return false;
	if (type === 'integer')
		return Number.isInteger(entry);

	return true;
};

const readLength = (value: unknown, path: string, key: 'minLength' | 'maxLength'): number | undefined => {
	if (value === undefined)
		return undefined;
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0)
		fail('schema', `${path}.${key} is a non-negative integer`);

	return value;
};

const readNode = (value: unknown, path: string): JsonSchemaDocument => {
	if (!isRecord(value))
		fail('schema', `${path} is an object`);

	for (const key of Object.keys(value)) {
		if (!NodeKeys.has(key))
			fail('schema', `${path} has unknown keyword ${key}. Allowed keywords are ${AllowedKeywords}.`);
	}

	const type = value.type;
	if (type !== 'string' && type !== 'number' && type !== 'integer' && type !== 'boolean' && type !== 'object' && type !== 'array')
		fail('schema', `${path}.type is string, number, integer, boolean, object, or array`);

	const description = readDescription(value.description, path);
	if (type === 'object')
		return readObjectNode(value, path, description);
	if (type === 'array')
		return readArrayNode(value, path, description);

	return readScalarNode(value, path, type, description);
};

const readScalarNode = (
	value: Record<string, unknown>,
	path: string,
	type: JsonSchemaScalarType,
	description: string | undefined,
): JsonSchemaScalar => {
	if (value.properties !== undefined || value.required !== undefined || value.additionalProperties !== undefined)
		fail('schema', `${path} carries object keywords on type ${type}`);
	if (value.items !== undefined)
		fail('schema', `${path}.items is only valid when type is array`);

	const node: JsonSchemaScalar = {type};
	if (description !== undefined)
		node.description = description;

	const enumValues = readEnum(value.enum, type, path);
	if (enumValues !== undefined)
		node.enum = enumValues;

	if (value.minLength !== undefined || value.maxLength !== undefined || value.pattern !== undefined) {
		if (type !== 'string')
			fail('schema', `${path} uses a string check on type ${type}`);
	}

	const minLength = readLength(value.minLength, path, 'minLength');
	const maxLength = readLength(value.maxLength, path, 'maxLength');
	if (minLength !== undefined && maxLength !== undefined && minLength > maxLength)
		fail('schema', `${path}.minLength is greater than maxLength`);
	if (minLength !== undefined)
		node.minLength = minLength;
	if (maxLength !== undefined)
		node.maxLength = maxLength;

	if (value.pattern !== undefined) {
		if (typeof value.pattern !== 'string' || value.pattern.length === 0)
			fail('schema', `${path}.pattern is a non-empty string`);
		try {
			new RegExp(value.pattern);
		} catch {
			fail('schema', `${path}.pattern is not a regular expression`);
		}
		node.pattern = value.pattern;
	}

	return node;
};

const readObjectNode = (
	value: Record<string, unknown>,
	path: string,
	description: string | undefined,
): JsonSchemaObject => {
	if (value.enum !== undefined)
		fail('schema', `${path}.enum is only valid on string, number, integer, or boolean`);
	if (value.minLength !== undefined || value.maxLength !== undefined || value.pattern !== undefined)
		fail('schema', `${path} uses a string check on type object`);
	if (value.items !== undefined)
		fail('schema', `${path}.items is only valid when type is array`);
	if (!isRecord(value.properties))
		fail('schema', `${path}.properties is an object listing each field. An object with no fields still sends properties {}.`);

	const properties: Record<string, JsonSchemaDocument> = {};
	for (const [name, child] of Object.entries(value.properties))
		properties[name] = readNode(child, `${path}.properties.${name}`);

	const node: JsonSchemaObject = {type: 'object', properties};
	if (description !== undefined)
		node.description = description;

	const required = readRequired(value.required, properties, path);
	if (required !== undefined)
		node.required = required;
	if (value.additionalProperties !== undefined) {
		if (typeof value.additionalProperties !== 'boolean')
			fail('schema', `${path}.additionalProperties is a boolean`);
		node.additionalProperties = value.additionalProperties;
	}
	return node;
};

const readArrayNode = (
	value: Record<string, unknown>,
	path: string,
	description: string | undefined,
): JsonSchemaArray => {
	if (value.enum !== undefined)
		fail('schema', `${path}.enum is only valid on string, number, integer, or boolean`);
	if (value.properties !== undefined || value.required !== undefined || value.additionalProperties !== undefined)
		fail('schema', `${path} carries object keywords on type array`);
	if (value.minLength !== undefined || value.maxLength !== undefined || value.pattern !== undefined)
		fail('schema', `${path} uses a string check on type array`);

	const node: JsonSchemaArray = {type: 'array', items: readNode(value.items, `${path}.items`)};
	if (description !== undefined)
		node.description = description;
	return node;
};

const readRequired = (
	required: unknown,
	properties: Record<string, JsonSchemaDocument>,
	path: string,
): readonly string[] | undefined => {
	if (required === undefined)
		return undefined;
	if (!Array.isArray(required))
		fail('schema', `${path}.required is an array of property names`);

	const names: string[] = [];
	for (const entry of required) {
		if (typeof entry !== 'string' || entry.length === 0)
			fail('schema', `${path}.required contains a property name`);
		if (!(entry in properties))
			fail('schema', `${path}.required names ${entry}, which is not a property`);
		if (names.includes(entry))
			fail('schema', `${path}.required lists ${entry} twice`);
		names.push(entry);
	}
	return names;
};

/** Check a document that claims to be a schema. */
export const validateJsonSchema = (value: unknown): JsonSchemaDocument =>
	readNode(value, 'schema');

/** Check a document and require an object root. */
export const validateObjectJsonSchema = (value: unknown): JsonSchemaObject => {
	const node = validateJsonSchema(value);
	if (node.type !== 'object')
		fail('schema', 'schema root is an object');

	return node;
};

const valueAllowed = (enumValues: readonly (string | number | boolean)[], value: unknown): boolean =>
	enumValues.some(entry => entry === value);

const readInstance = (node: JsonSchemaDocument, value: unknown, path: string): unknown => {
	if (node.type === 'string')
		return readString(node, value, path);
	if (node.type === 'number')
		return readNumber(node, value, path, false);
	if (node.type === 'integer')
		return readNumber(node, value, path, true);
	if (node.type === 'boolean')
		return readBoolean(node, value, path);
	if (node.type === 'array')
		return readArray(node, value, path);
	if (node.type === 'object')
		return readObject(node, value, path);

	fail('instance', `${path} is a ${node.type}`);
};

const readString = (node: JsonSchemaScalar, value: unknown, path: string): string => {
	if (typeof value !== 'string')
		fail('instance', `${path} is a string`);
	if (node.minLength !== undefined && value.length < node.minLength)
		fail('instance', `${path} is shorter than minLength ${node.minLength}`);
	if (node.maxLength !== undefined && value.length > node.maxLength)
		fail('instance', `${path} is longer than maxLength ${node.maxLength}`);
	if (node.pattern !== undefined && !new RegExp(node.pattern).test(value))
		fail('instance', `${path} does not match pattern ${node.pattern}`);
	if (node.enum !== undefined && !valueAllowed(node.enum, value))
		fail('instance', `${path} is not an allowed value`);

	return value;
};

const readNumber = (node: JsonSchemaScalar, value: unknown, path: string, integer: boolean): number => {
	if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isInteger(value)))
		fail('instance', `${path} is ${integer ? 'an integer' : 'a number'}`);
	if (node.enum !== undefined && !valueAllowed(node.enum, value))
		fail('instance', `${path} is not an allowed value`);

	return value;
};

const readBoolean = (node: JsonSchemaScalar, value: unknown, path: string): boolean => {
	if (typeof value !== 'boolean')
		fail('instance', `${path} is a boolean`);
	if (node.enum !== undefined && !valueAllowed(node.enum, value))
		fail('instance', `${path} is not an allowed value`);

	return value;
};

const readArray = (node: JsonSchemaArray, value: unknown, path: string): unknown[] => {
	if (!Array.isArray(value))
		fail('instance', `${path} is an array`);

	return value.map((entry, index) => readInstance(node.items, entry, `${path}[${index}]`));
};

const readObject = (node: JsonSchemaObject, value: unknown, path: string): Record<string, unknown> => {
	if (!isRecord(value))
		fail('instance', `${path} is an object`);

	const allowExtra = node.additionalProperties === true;
	for (const key of Object.keys(value)) {
		if (!(key in node.properties) && !allowExtra)
			fail('instance', `${path}.${key} is not in the schema`);
	}

	for (const name of node.required ?? []) {
		if (value[name] === undefined)
			fail('instance', `${path}.${name} is required`);
	}

	const out: Record<string, unknown> = {};
	for (const [name, child] of Object.entries(node.properties)) {
		if (value[name] !== undefined)
			out[name] = readInstance(child, value[name], `${path}.${name}`);
	}
	if (allowExtra) {
		for (const [name, entry] of Object.entries(value)) {
			if (!(name in node.properties))
				out[name] = entry;
		}
	}
	return out;
};

/** Check a value against a schema that already passed validateJsonSchema. description is not a check. */
export const validateJsonSchemaInstance = (schema: JsonSchemaDocument, value: unknown, path = 'value'): unknown =>
	readInstance(schema, value, path);
