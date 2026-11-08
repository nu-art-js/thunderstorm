/*
 * ts-common — JSON schema validator, instance validator, and TypeScript printer
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {
	schemaAsType,
	validateJsonSchema,
	validateJsonSchemaInstance,
	validateObjectJsonSchema,
} from '../../main/index.js';

type Input = {schema: unknown; value?: unknown; name?: string};
type Result = unknown;
type TestCase = TestModel<Input, Result>;

const runTestCase = (testCase: TestCase) => () => runSingleTestCase(async (input: Input): Promise<Result> => {
	if (input.value === undefined && input.name === undefined)
		return validateJsonSchema(input.schema);
	if (input.name !== undefined)
		return schemaAsType(input.name, input.schema as Record<string, unknown>);

	return validateJsonSchemaInstance(validateObjectJsonSchema(input.schema), input.value, 'instance');
}, testCase);

const statusSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
			enum: ['open', 'closed'],
			description: 'Whether this item is still being worked',
		},
	},
	required: ['status'],
};

describe('JSON schema', () => {
	it('keeps a field description and enum', runTestCase({
		input: {schema: statusSchema},
		result: statusSchema,
	}));

	it('rejects title and format', runTestCase({
		input: {schema: {type: 'object', title: 'Person', properties: {}}},
		error: {expected: /unknown keyword title/},
	}));

	it('rejects format', runTestCase({
		input: {schema: {type: 'string', format: 'date'}},
		error: {expected: /unknown keyword format/},
	}));

	it('accepts an allowed enum value and ignores description', runTestCase({
		input: {schema: statusSchema, value: {status: 'open'}},
		result: {status: 'open'},
	}));

	it('rejects a value outside the enum', runTestCase({
		input: {schema: statusSchema, value: {status: 'later'}},
		error: {expected: /instance\.status is not an allowed value/},
	}));

	it('prints enum as a union and description as a comment', runTestCase({
		input: {schema: statusSchema, name: 'Item'},
		result: [
			'type Item = {',
			'  status: "open" | "closed"; // Whether this item is still being worked',
			'};',
		].join('\n'),
	}));

	it('prints an open map as an index signature', runTestCase({
		input: {
			name: 'Children',
			schema: {
				type: 'object',
				description: 'id to label',
				additionalProperties: {type: 'string', description: 'One-liner'},
			},
		},
		result: [
			'// id to label',
			'type Children = {',
			'  [key: string]: string; // One-liner',
			'};',
		].join('\n'),
	}));

	it('prints a nested object description above the property', runTestCase({
		input: {
			name: 'Wrap',
			schema: {
				type: 'object',
				properties: {
					child: {
						type: 'object',
						description: 'The child',
						properties: {name: {type: 'string', description: 'Name'}},
						required: ['name'],
					},
				},
				required: ['child'],
			},
		},
		result: [
			'type Wrap = {',
			'  // The child',
			'  child: {',
			'    name: string; // Name',
			'  };',
			'};',
		].join('\n'),
	}));

	it('prints a pattern on the field comment', runTestCase({
		input: {
			name: 'Ref',
			schema: {
				type: 'object',
				properties: {
					id: {type: 'string', description: 'Node id', pattern: '^[0-9a-f]{32}$'},
				},
				required: ['id'],
			},
		},
		result: [
			'type Ref = {',
			'  id: string; // Node id, pattern ^[0-9a-f]{32}$',
			'};',
		].join('\n'),
	}));
});
