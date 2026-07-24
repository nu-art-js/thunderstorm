/*
 * @nu-art/db-api-backend - query.join mongo-only fail-fast
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {BadImplementationException} from '@nu-art/ts-common';
import {MongoCollection} from '@nu-art/firebase-backend';
import type {BaseDBDefBE} from '../main/backend-types.js';
import type {CrudClause_Where} from '@nu-art/db-api-shared';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {CrudJoinForeignModule, CrudJoinQuerySpec} from '../main/join-query-types.js';
import {ModuleBE_BaseDB} from '../main/ModuleBE_BaseDB.js';
import {MockModuleBE_BaseDB_Class} from './mocks/MockDbModuleForApi.js';
import {createMockFirestoreCollectionV3} from './mocks/MockFirestoreCollectionV3.js';

const TEST_DB_DEF: BaseDBDefBE = {dbKey: 'join-test', entityName: 'JoinTest', versions: ['v1']};

function stubMongoCollection(dbName: string, joinImpl: (pipeline: unknown[]) => Promise<unknown[]>): MongoCollection<any> {
	const stub = Object.create(MongoCollection.prototype) as MongoCollection<any>;
	(stub as { dbDef: { backend: { name: string } } }).dbDef = {backend: {name: dbName}};
	const noopQuery = async () => [] as unknown[];
	stub.runTransaction = async fn => fn();
	(stub as any).create = {item: async (x: unknown) => x, all: async (xs: unknown[]) => xs};
	(stub as any).set = {item: async (x: unknown) => x, all: async (xs: unknown[]) => xs, multi: async (xs: unknown[]) => xs};
	(stub as any).delete = {unique: async () => undefined, item: async () => undefined, all: async () => [], allItems: async () => [], multi: async () => []};
	stub.ensureIndices = async () => undefined;
	stub.query = Object.freeze({
		unique: async () => undefined,
		uniqueUnmanipulated: async () => undefined,
		uniqueAssert: noopQuery as any,
		uniqueWhere: noopQuery as any,
		uniqueCustom: noopQuery as any,
		all: async () => [],
		custom: noopQuery,
		where: noopQuery,
		unManipulatedQuery: noopQuery,
		join: joinImpl,
	}) as MongoCollection<any>['query'];
	return stub;
}

function stubForeignModule(
	dbKey: string,
	collectionName: string,
	compileQueryWhere: CrudJoinForeignModule['compileQueryWhere'],
): CrudJoinForeignModule {
	return {
		dbDef: {dbKey},
		collection: stubMongoCollection(collectionName, async () => []),
		compileQueryWhere,
	};
}

describe('ModuleBE_BaseDB.query.join', () => {
	it('throws on non-mongo backend', async () => {
		const mod = new MockModuleBE_BaseDB_Class(TEST_DB_DEF, createMockFirestoreCollectionV3());
		mod.init();

		try {
			await mod.query.join({joins: []});
			expect.fail('should have thrown');
		} catch (e: unknown) {
			expect(e).to.be.instanceOf(BadImplementationException);
			expect((e as Error).message).to.match(/mongo backend/i);
		}
	});

	it('runs aggregate join on mongo and applies per-hop manipulateQuery', async () => {
		let capturedPipeline: unknown[] | undefined;
		const localMongo = stubMongoCollection('nodes', async pipeline => {
			capturedPipeline = pipeline;
			return [{_id: 'n1', assignment: {_id: 'a1'}, doc: {_id: 'd1'}}];
		});

		class MongoJoinLocal_Class extends ModuleBE_BaseDB<any> {
			constructor() {
				super(TEST_DB_DEF, {chunksSize: 200});
			}

			resolveCollection() {
				this.collection = localMongo;
			}

			manipulateQuery(query: FirestoreQuery<any>): FirestoreQuery<any> {
				if (query.where)
					return {...query, where: {...query.where, scopedLocal: true} as CrudClause_Where<any>};
				return query;
			}
		}

		const foreignCompile: CrudJoinForeignModule['compileQueryWhere'] = where =>
			where ? {...where, scopedForeign: true} as CrudClause_Where<any> : where;

		const foreign = stubForeignModule('assignments', 'node-assignments', foreignCompile);

		const mod = new MongoJoinLocal_Class();
		mod.init();

		const spec: CrudJoinQuerySpec<any> = {
			where: {active: true} as CrudClause_Where<any>,
			joins: [{
				module: foreign,
				localField: '_id',
				foreignField: 'nodeId',
				as: 'assignment',
				where: {active: true} as CrudClause_Where<any>,
			}],
		};

		const rows = await mod.query.join(spec);
		expect(rows).to.have.length(1);
		expect(capturedPipeline).to.be.an('array');
		expect(capturedPipeline![0]).to.deep.equal({$match: {active: true, scopedLocal: true}});
		const lookup = capturedPipeline!.find(stage => '$lookup' in (stage as object)) as {
			$lookup: { from: string; pipeline: unknown[] }
		};
		expect(lookup.$lookup.from).to.equal('node-assignments');
		const foreignMatch = lookup.$lookup.pipeline.find(stage => '$match' in (stage as object) && !('$expr' in (stage as {$match: object}).$match)) as {$match: Record<string, unknown>};
		expect(foreignMatch.$match).to.deep.equal({active: true, scopedForeign: true});
	});
});
