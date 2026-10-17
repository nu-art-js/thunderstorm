/*
 * @nu-art/sync-manager-backend — SyncApiHandler returns the write set
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemKey_HttpRequestBody, type HttpServer} from '@nu-art/http-server';
import {type DB_Object} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {syncApiDef} from '@nu-art/sync-manager-shared';
import {SyncApiHandler} from '../main/SyncApiHandler.js';
import {emptyWrittenSync, MemKey_WrittenSync, recordWrittenSync} from '../main/written-sync.js';

const doc = (id: string): DB_Object => ({_id: id, __created: 1, __updated: 2});

describe('SyncApiHandler', () => {
	it('keeps the method void and sends the write set from the route', async () => {
		const added: {process: () => Promise<unknown>}[] = [];
		const mockServer = {
			addRoute(api: {process: () => Promise<unknown>}) {
				added.push(api);
			},
		};
		const apiDef = syncApiDef({method: 'post', path: '/v1/test-sync'});

		class Mint {
			calls = 0;

			@SyncApiHandler(apiDef, {httpServer: () => mockServer as unknown as HttpServer})
			async mint(_body: {projectIds: string[]}): Promise<void> {
				this.calls++;
				recordWrittenSync('mcp--clients', {updated: [doc('client-1')]});
			}
		}

		const mint = new Mint();
		await new MemStorage().init(async () => {
			expect(await mint.mint({projectIds: ['p1']})).to.equal(undefined);
		});
		expect(mint.calls).to.equal(1);
		expect(added).to.have.length(1);

		await new MemStorage().init(async () => {
			MemKey_WrittenSync.set(emptyWrittenSync());
			MemKey_HttpRequestBody.set({projectIds: ['p1']});
			const body = await added[0].process();
			expect(body).to.deep.equal([{
				dbKey: 'mcp--clients',
				toUpdate: [doc('client-1')],
				toDelete: [],
			}]);
		});
		expect(mint.calls).to.equal(2);
	});
});
