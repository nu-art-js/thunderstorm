/*
 * @nu-art/permissions-backend - Pure unit tests for per-SA access-id cache
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import type {UniqueId} from '@nu-art/ts-common';
import {ModuleBE_AccessGroupDB} from '../main/_entity/access-group/ModuleBE_AccessGroupDB.js';
import {ModuleBE_Permissions} from '../main/modules/ModuleBE_Permissions.js';

const mod = ModuleBE_Permissions as any;
const SA_GROUP = 'sa-group-immutable' as UniqueId;
const SA_GROUP_TTL = 'sa-group-ttl' as UniqueId;
const SA_GROUP_DEFAULT = 'sa-group-default' as UniqueId;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe('SA access-id cache (per-entry TTL / immutable)', () => {
	let whereCalls = 0;
	let originalQuery: any;

	beforeEach(() => {
		// Stub the access-group DB query to count materializations without a DB.
		originalQuery = (ModuleBE_AccessGroupDB as any).query;
		whereCalls = 0;
		(ModuleBE_AccessGroupDB as any).query = {
			where: async () => {
				whereCalls++;
				return [];
			},
		};
		// Clear any cached entries from a previous test.
		mod.saAccessIdCache.clear();
	});

	afterEach(() => {
		(ModuleBE_AccessGroupDB as any).query = originalQuery;
		mod.saAccessIdCache.clear();
	});

	it('immutable SA materializes once and serves all subsequent resolves from cache', async () => {
		const directive = {immutable: true};
		await mod.resolveSAAccessIds(SA_GROUP, directive);
		await mod.resolveSAAccessIds(SA_GROUP, directive);
		await mod.resolveSAAccessIds(SA_GROUP, directive);

		expect(whereCalls).to.equal(1);
	});

	it('immutable entry has no time expiry (expiresAt === Infinity)', async () => {
		await mod.resolveSAAccessIds(SA_GROUP, {immutable: true});
		const entry = mod.saAccessIdCache.get(SA_GROUP);

		expect(entry).to.not.be.undefined;
		expect(entry.expiresAt).to.equal(Number.POSITIVE_INFINITY);
	});

	it('TTL SA re-materializes after its TTL elapses', async () => {
		const directive = {ttlMs: 20};
		await mod.resolveSAAccessIds(SA_GROUP_TTL, directive); // materialize -> 1
		await mod.resolveSAAccessIds(SA_GROUP_TTL, directive); // cached     -> 1
		expect(whereCalls).to.equal(1);

		await sleep(35);
		await mod.resolveSAAccessIds(SA_GROUP_TTL, directive); // expired -> 2
		expect(whereCalls).to.equal(2);
	});

	it('no directive falls back to the global default TTL and caches', async () => {
		await mod.resolveSAAccessIds(SA_GROUP_DEFAULT);
		await mod.resolveSAAccessIds(SA_GROUP_DEFAULT);

		expect(whereCalls).to.equal(1);
		const entry = mod.saAccessIdCache.get(SA_GROUP_DEFAULT);
		expect(entry.expiresAt).to.be.greaterThan(Date.now());
		expect(entry.expiresAt).to.be.lessThan(Number.POSITIVE_INFINITY);
	});

	it('__onAccessGroupChanged invalidates immutable entries', async () => {
		await mod.resolveSAAccessIds(SA_GROUP, {immutable: true});
		expect(mod.getCachedSAAccessIds(SA_GROUP)).to.not.be.undefined;

		await mod.__onAccessGroupChanged(['some-changed-group' as UniqueId]);

		expect(mod.getCachedSAAccessIds(SA_GROUP)).to.be.undefined;
	});

	it('resolved access-ids always include the SA personal group under _self', async () => {
		const accessIds = await mod.resolveSAAccessIds(SA_GROUP, {immutable: true});
		expect(accessIds._self).to.deep.equal([SA_GROUP]);
	});
});
