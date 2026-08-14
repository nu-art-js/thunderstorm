/*
 * @nu-art/ts-common - Core TypeScript infrastructure
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {TestModel, defaultTestProcessor, runSingleTestCase} from '@nu-art/testalot';
import {
	tsValidateArray,
	tsValidateOptionalObject,
	tsValidateResult,
	tsValidateString,
} from '../../main/index.js';


type Nested = { name: string; extra?: string };
type Root = { title: string; nested?: Nested; items?: Nested[] };

const nestedValidator = {
	name: tsValidateString(),
};

const rootValidator = {
	title: tsValidateString(),
	nested: tsValidateOptionalObject(nestedValidator),
	items: tsValidateArray(nestedValidator, false),
};

type Input = { instance: Root; strict: boolean };
type Result = ReturnType<typeof tsValidateResult<Root>>;
type TestCase_StrictRecursive = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> =>
	tsValidateResult(input.instance, rootValidator, undefined, input.strict);
const runTestCase = (testCase: TestCase_StrictRecursive) =>
	() => runSingleTestCase(test, testCase, defaultTestProcessor);

const hasUnexpected = (result: Result, path: string[]) => {
	let cursor: any = result;
	for (const key of path) {
		if (!cursor || typeof cursor !== 'object')
			return false;
		cursor = cursor[key];
	}
	return typeof cursor === 'string' && cursor.includes('Unexpected key');
};

describe('tsValidateResult — recursive not-strict', () => {
	it('strict reports unexpected keys on a nested optional object', runTestCase({
		input: {
			strict: true,
			instance: {title: 'ok', nested: {name: 'n', extra: 'x'}},
		},
		result: async (actual) => {
			expect(hasUnexpected(actual, ['nested', 'extra'])).to.equal(true);
		},
	}));

	it('not-strict ignores unexpected keys on a nested optional object', runTestCase({
		input: {
			strict: false,
			instance: {title: 'ok', nested: {name: 'n', extra: 'x'}},
		},
		result: async (actual) => {
			expect(actual).to.equal(undefined);
		},
	}));

	it('strict reports unexpected keys on array elements', runTestCase({
		input: {
			strict: true,
			instance: {title: 'ok', items: [{name: 'n', extra: 'x'}]},
		},
		result: async (actual) => {
			expect(hasUnexpected(actual, ['items', '0', 'extra'])).to.equal(true);
		},
	}));

	it('not-strict ignores unexpected keys on array elements', runTestCase({
		input: {
			strict: false,
			instance: {title: 'ok', items: [{name: 'n', extra: 'x'}]},
		},
		result: async (actual) => {
			expect(actual).to.equal(undefined);
		},
	}));

	it('not-strict still reports type errors on nested fields', runTestCase({
		input: {
			strict: false,
			instance: {title: 'ok', nested: {name: 1 as unknown as string}},
		},
		result: async (actual) => {
			expect(actual).to.not.equal(undefined);
			expect(hasUnexpected(actual, ['nested', 'name'])).to.equal(false);
			expect((actual as any).nested.name).to.be.a('string');
		},
	}));

});

describe('tsValidateResult — inline nested TypeValidator', () => {
	type InlineRoot = { title: string; nested: { name: string } };
	type InlineInput = { instance: InlineRoot; strict: boolean };
	type InlineCase = TestModel<InlineInput, Result>;

	const inlineValidator = {
		title: tsValidateString(),
		nested: {name: tsValidateString()},
	};

	const runInline = (testCase: InlineCase) =>
		() => runSingleTestCase(
			async (input: InlineInput) => tsValidateResult(input.instance, inlineValidator, undefined, input.strict),
			testCase,
			defaultTestProcessor,
		);

	it('not-strict ignores unexpected keys on an inline nested object', runInline({
		input: {
			strict: false,
			instance: {title: 'ok', nested: {name: 'n', extra: 'x'}} as InlineRoot,
		},
		result: async (actual) => {
			expect(actual).to.equal(undefined);
		},
	}));
});

describe('tsValidateResult — top-level not-strict', () => {
	it('not-strict ignores unexpected keys on the root object', runTestCase({
		input: {
			strict: false,
			instance: {title: 'ok', leftover: 'x'} as Root,
		},
		result: async (actual) => {
			expect(actual).to.equal(undefined);
		},
	}));

	it('strict reports unexpected keys on the root object', runTestCase({
		input: {
			strict: true,
			instance: {title: 'ok', leftover: 'x'} as Root,
		},
		result: async (actual) => {
			expect(hasUnexpected(actual, ['leftover'])).to.equal(true);
		},
	}));
});
