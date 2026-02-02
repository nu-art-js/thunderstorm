/*
 * @nu-art/db-api-backend - Unit tests for CRUD API definition usage
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {HttpMethod} from '@nu-art/http-client';

type Input = { dbKey: string; version?: string };
type Result = ReturnType<typeof CrudApiDef>;

const test = async (input: Input): Promise<Result> => CrudApiDef(input.dbKey, input.version);
type TestCase_CrudApiDef = TestModel<Input, Result>;
const runTestCase = (tc: TestCase_CrudApiDef) => () => runSingleTestCase(test, tc);

describe('CrudApiDef', () => {
	it('default version v1: paths and methods', runTestCase({
		input: { dbKey: 'tasks' },
		result: async (actual) => {
			expect(actual.query.method).to.equal(HttpMethod.POST);
			expect(actual.query.path).to.equal('v1/tasks/query');
			expect(actual.queryUnique.method).to.equal(HttpMethod.GET);
			expect(actual.queryUnique.path).to.equal('v1/tasks/query-unique');
			expect(actual.upsert.path).to.equal('v1/tasks/upsert');
			expect(actual.upsertAll.path).to.equal('v1/tasks/upsert-all');
			expect(actual.deleteUnique.path).to.equal('v1/tasks/delete-unique');
			expect(actual.deleteQuery.path).to.equal('v1/tasks/delete-query');
			expect(actual.deleteAll.path).to.equal('v1/tasks/delete-all');
		}
	}));

	it('custom version v2: paths use version', runTestCase({
		input: { dbKey: 'items', version: 'v2' },
		result: async (actual) => {
			expect(actual.query.path).to.equal('v2/items/query');
			expect(actual.queryUnique.path).to.equal('v2/items/query-unique');
			expect(actual.upsert.path).to.equal('v2/items/upsert');
			expect(actual.deleteAll.path).to.equal('v2/items/delete-all');
		}
	}));
});
