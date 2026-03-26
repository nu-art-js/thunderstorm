/*
 * @nu-art/db-api-backend - Unit tests for ModuleBE_BaseDB interceptor chain
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ModuleBE_BaseDB} from '../main/ModuleBE_BaseDB.js';
import type {BaseDBDefBE} from '../main/backend-types.js';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import type {DBEntityDependencies} from '@nu-art/db-api-shared';
import type {Transaction} from 'firebase-admin/firestore';
const TEST_DB_DEF: BaseDBDefBE = {dbKey: 'interceptor-test', entityName: 'InterceptorTest', versions: ['v1']};

class InterceptorTestModule_Class
	extends ModuleBE_BaseDB<any> {

	callLog: string[] = [];

	constructor() {
		super(TEST_DB_DEF, {chunksSize: 200});
	}

	protected resolveCollection() {
	}

	protected async preWriteProcessing() {
		this.callLog.push('preWriteProcessing');
	}

	manipulateQuery(query: FirestoreQuery<any>): FirestoreQuery<any> {
		this.callLog.push('manipulateQuery');
		return query;
	}

	async collectDependencies(_dbInstances: any[], _transaction?: Transaction): Promise<DBEntityDependencies | undefined> {
		this.callLog.push('collectDependencies');
		return undefined;
	}
}

function createModule(): InterceptorTestModule_Class {
	return new InterceptorTestModule_Class();
}

describe('ModuleBE_BaseDB interceptor chain', () => {

	describe('preWrite interceptors', () => {

		it('runs registered interceptor before preWriteProcessing', async () => {
			const mod = createModule();
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('interceptor-1');
			});

			await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
			expect(mod.callLog).to.deep.equal(['interceptor-1', 'preWriteProcessing']);
		});

		it('chains multiple interceptors in registration order', async () => {
			const mod = createModule();
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('first');
			});
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('second');
			});
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('third');
			});

			await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
			expect(mod.callLog).to.deep.equal(['first', 'second', 'third', 'preWriteProcessing']);
		});

		it('throwing interceptor blocks preWriteProcessing', async () => {
			const mod = createModule();
			mod.registerPreWriteInterceptor(async () => {
				throw new Error('access denied');
			});

			try {
				await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
				expect.fail('should have thrown');
			} catch (e: unknown) {
				expect((e as Error).message).to.equal('access denied');
			}

			expect(mod.callLog).to.deep.equal([]);
		});

		it('second interceptor does not run if first throws', async () => {
			const mod = createModule();
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('first');
				throw new Error('blocked');
			});
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('second');
			});

			try {
				await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
				expect.fail('should have thrown');
			} catch (e: unknown) {
				expect((e as Error).message).to.equal('blocked');
			}

			expect(mod.callLog).to.deep.equal(['first']);
		});

		it('receives dbItem and original arguments', async () => {
			const mod = createModule();
			let captured: { dbItem: any; original: any } | undefined;
			mod.registerPreWriteInterceptor(async (dbItem, original) => {
				captured = {dbItem, original};
			});

			const uiItem = {_id: 'x', name: 'new'};
			const dbItem = {_id: 'x', name: 'old'};
			await (mod as any)._preWriteProcessing(uiItem, dbItem);

			expect(captured).to.not.be.undefined;
			expect(captured!.dbItem).to.equal(uiItem);
			expect(captured!.original).to.equal(dbItem);
		});
	});

	describe('query interceptors', () => {

		it('runs registered interceptor before manipulateQuery', () => {
			const mod = createModule();
			mod.registerQueryInterceptor((query: FirestoreQuery<any>) => {
				mod.callLog.push('interceptor-1');
				return query;
			});

			(mod as any)._manipulateQuery({where: {}});
			expect(mod.callLog).to.deep.equal(['interceptor-1', 'manipulateQuery']);
		});

		it('chains output-to-input across multiple interceptors', () => {
			const mod = createModule();

			mod.registerQueryInterceptor((query: FirestoreQuery<any>) => {
				return {...query, where: {...query.where, orgId: 'org-1'}};
			});
			mod.registerQueryInterceptor((query: FirestoreQuery<any>) => {
				return {...query, where: {...query.where, active: true}};
			});

			const result = (mod as any)._manipulateQuery({where: {name: 'test'}});
			expect(result.where).to.deep.include({name: 'test', orgId: 'org-1', active: true});
		});

		it('interceptor output feeds into manipulateQuery override', () => {
			const mod = createModule();
			let receivedByOverride: FirestoreQuery<any> | undefined;
			mod.manipulateQuery = (query: FirestoreQuery<any>) => {
				receivedByOverride = query;
				return query;
			};

			mod.registerQueryInterceptor((query: FirestoreQuery<any>) => {
				return {...query, where: {...query.where, injected: true}};
			});

			(mod as any)._manipulateQuery({where: {base: 1}});
			expect(receivedByOverride!.where).to.deep.include({base: 1, injected: true});
		});
	});

	describe('preDelete interceptors', () => {

		it('runs registered interceptor before collectDependencies', async () => {
			const mod = createModule();
			mod.registerPreDeleteInterceptor(async () => {
				mod.callLog.push('interceptor-1');
			});

			await mod.canDeleteItems([{_id: 'a'} as any]);
			expect(mod.callLog).to.deep.equal(['interceptor-1', 'collectDependencies']);
		});

		it('chains multiple interceptors in registration order', async () => {
			const mod = createModule();
			mod.registerPreDeleteInterceptor(async () => {
				mod.callLog.push('first');
			});
			mod.registerPreDeleteInterceptor(async () => {
				mod.callLog.push('second');
			});

			await mod.canDeleteItems([{_id: 'a'} as any]);
			expect(mod.callLog).to.deep.equal(['first', 'second', 'collectDependencies']);
		});

		it('throwing interceptor blocks collectDependencies', async () => {
			const mod = createModule();
			mod.registerPreDeleteInterceptor(async () => {
				throw new Error('delete denied');
			});

			try {
				await mod.canDeleteItems([{_id: 'a'} as any]);
				expect.fail('should have thrown');
			} catch (e: unknown) {
				expect((e as Error).message).to.equal('delete denied');
			}

			expect(mod.callLog).to.deep.equal([]);
		});

		it('receives dbItems and transaction arguments', async () => {
			const mod = createModule();
			let captured: { items: any[]; tx: Transaction | undefined } | undefined;
			mod.registerPreDeleteInterceptor(async (items: any[], tx?: Transaction) => {
				captured = {items, tx};
			});

			const items = [{_id: 'a'}, {_id: 'b'}] as any[];
			const fakeTx = {id: 'mock-tx'} as unknown as Transaction;
			await mod.canDeleteItems(items, fakeTx);

			expect(captured).to.not.be.undefined;
			expect(captured!.items).to.equal(items);
			expect(captured!.tx).to.equal(fakeTx);
		});
	});

	describe('registration', () => {

		it('no interceptors means subclass override runs directly', async () => {
			const mod = createModule();
			await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
			(mod as any)._manipulateQuery({where: {}});
			await mod.canDeleteItems([{_id: 'a'} as any]);

			expect(mod.callLog).to.deep.equal(['preWriteProcessing', 'manipulateQuery', 'collectDependencies']);
		});

		it('interceptors persist across multiple calls', async () => {
			const mod = createModule();
			mod.registerPreWriteInterceptor(async () => {
				mod.callLog.push('interceptor');
			});

			await (mod as any)._preWriteProcessing({_id: 'a'}, {_id: 'a'});
			await (mod as any)._preWriteProcessing({_id: 'b'}, {_id: 'b'});

			expect(mod.callLog).to.deep.equal([
				'interceptor', 'preWriteProcessing',
				'interceptor', 'preWriteProcessing'
			]);
		});
	});
});
