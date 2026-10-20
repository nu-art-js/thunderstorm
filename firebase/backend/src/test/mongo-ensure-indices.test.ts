/*
 * @nu-art/firebase-backend — MongoCollection.ensureIndices current contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {BadImplementationException} from '@nu-art/ts-common';
import {MongoCollection} from '../main/firestore/MongoCollection.js';

type IndexCall = {spec: Record<string, unknown>; options: Record<string, unknown>};

type IndexDef = {
	id: string;
	keys: string | string[];
	params?: {unique: boolean; multiEntry: boolean};
	mongo?: {
		keys: {field: string; direction?: 1 | -1 | 'text'}[];
		defaultLanguage?: string;
		weights?: Record<string, number>;
	};
};

let lastCalls: IndexCall[] = [];

async function ensure(indices?: IndexDef[]): Promise<IndexCall[]> {
	const calls: IndexCall[] = [];
	lastCalls = calls;
	const db = {
		collection: () => ({
			createIndex: async (spec: Record<string, unknown>, options: Record<string, unknown>) => {
				calls.push({spec, options});
				return 'index';
			},
		}),
	};
	const collection = new MongoCollection(async () => db as never, {
		dbKey: 'nodes',
		entityName: 'node',
		frontend: {name: 'nodes', group: 'knowledge'},
		backend: {name: 'nodes'},
		versions: ['1.0.0'],
		generatedPropsValidator: {},
		modifiablePropsValidator: {},
		indices,
	} as never);
	await collection.ensureIndices();
	return calls;
}

describe('MongoCollection.ensureIndices — current ordered indexes', () => {
	it('creates nothing when indices is missing or empty', async () => {
		expect(await ensure()).to.deep.equal([]);
		expect(await ensure([])).to.deep.equal([]);
	});

	it('indexes one key ascending and passes unique', async () => {
		const calls = await ensure([{
			id: 'by-chatId',
			keys: ['chatId'],
			params: {unique: true, multiEntry: false},
		}]);
		expect(calls).to.deep.equal([{
			spec: {chatId: 1},
			options: {name: 'by-chatId', unique: true},
		}]);
	});

	it('keeps compound key order and defaults unique to false', async () => {
		const calls = await ensure([{
			id: 'by-orgId-lastActivity',
			keys: ['_orgId', 'lastActivityAt'],
		}]);
		expect(calls).to.deep.equal([{
			spec: {_orgId: 1, lastActivityAt: 1},
			options: {name: 'by-orgId-lastActivity', unique: false},
		}]);
	});

	it('forwards a dotted key string as an ascending path', async () => {
		const calls = await ensure([{
			id: 'by-parent-child',
			keys: ['parent.dbKey', 'parent.id', 'childDbKey'],
			params: {unique: true, multiEntry: false},
		}]);
		expect(calls).to.deep.equal([{
			spec: {'parent.dbKey': 1, 'parent.id': 1, childDbKey: 1},
			options: {name: 'by-parent-child', unique: true},
		}]);
	});

	it('ignores multiEntry and keeps declaration order', async () => {
		const calls = await ensure([
			{id: 'by-a', keys: 'accountId', params: {unique: false, multiEntry: true}},
			{id: 'by-b', keys: ['projectId'], params: {unique: false, multiEntry: false}},
		]);
		expect(calls).to.deep.equal([
			{spec: {accountId: 1}, options: {name: 'by-a', unique: false}},
			{spec: {projectId: 1}, options: {name: 'by-b', unique: false}},
		]);
	});
});

describe('MongoCollection.ensureIndices — mongo spec', () => {
	it('uses mongo.keys, including descending and dotted fields, and ignores keys', async () => {
		const calls = await ensure([{
			id: 'by-target-updated',
			keys: ['ignored'],
			mongo: {
				keys: [
					{field: 'target.id'},
					{field: '__updated', direction: -1},
				],
			},
		}]);
		expect(calls).to.deep.equal([{
			spec: {'target.id': 1, __updated: -1},
			options: {name: 'by-target-updated', unique: false},
		}]);
	});

	it('builds one text index with language and weights', async () => {
		const calls = await ensure([{
			id: 'by-text',
			keys: ['_path', 'label'],
			mongo: {
				keys: [
					{field: '_path', direction: 'text'},
					{field: 'label', direction: 'text'},
				],
				defaultLanguage: 'none',
				weights: {label: 5, _path: 1},
			},
		}]);
		expect(calls).to.deep.equal([{
			spec: {_path: 'text', label: 'text'},
			options: {
				name: 'by-text',
				unique: false,
				default_language: 'none',
				weights: {label: 5, _path: 1},
			},
		}]);
	});

	it('rejects a unique text index before createIndex', async () => {
		try {
			await ensure([{
				id: 'by-text',
				keys: ['body'],
				params: {unique: true, multiEntry: false},
				mongo: {keys: [{field: 'body', direction: 'text'}]},
			}]);
			expect.fail('should have thrown');
		} catch (e: unknown) {
			expect(e).to.be.instanceOf(BadImplementationException);
			expect((e as Error).message).to.match(/cannot be unique and text/);
			expect(lastCalls).to.deep.equal([]);
		}
	});

	it('rejects a second text index before createIndex', async () => {
		try {
			await ensure([
				{id: 'by-label', keys: ['label'], mongo: {keys: [{field: 'label', direction: 'text'}]}},
				{id: 'by-body', keys: ['body'], mongo: {keys: [{field: 'body', direction: 'text'}]}},
			]);
			expect.fail('should have thrown');
		} catch (e: unknown) {
			expect(e).to.be.instanceOf(BadImplementationException);
			expect((e as Error).message).to.match(/Only one text index/);
			expect(lastCalls).to.deep.equal([]);
		}
	});
});
