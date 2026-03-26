/*
 * @nu-art/permissions-backend - Unit tests for wireEntityPermissions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {wireEntityPermissions} from '../main/entity-permissions.js';
import type {EntityPermissionPolicy} from '../main/entity-permissions.js';
import type {PreWriteInterceptor, QueryInterceptor, PreDeleteInterceptor} from '@nu-art/db-api-backend';
import type {FirestoreQuery} from '@nu-art/firebase-shared';

type RegisteredInterceptors = {
	preWrite: PreWriteInterceptor[];
	query: QueryInterceptor[];
	preDelete: PreDeleteInterceptor[];
};

function createFakeDbModule(): { registered: RegisteredInterceptors; module: any } {
	const registered: RegisteredInterceptors = {preWrite: [], query: [], preDelete: []};

	const module = {
		registerPreWriteInterceptor: (fn: PreWriteInterceptor) => {
			registered.preWrite.push(fn);
		},
		registerQueryInterceptor: (fn: QueryInterceptor) => {
			registered.query.push(fn);
		},
		registerPreDeleteInterceptor: (fn: PreDeleteInterceptor) => {
			registered.preDelete.push(fn);
		}
	};

	return {registered, module};
}

describe('wireEntityPermissions', () => {

	it('registers all three interceptor types when all provided', () => {
		const {registered, module} = createFakeDbModule();

		const preWrite: PreWriteInterceptor = async () => {};
		const queryInterceptor: QueryInterceptor = (q: FirestoreQuery<any>) => q;
		const preDelete: PreDeleteInterceptor = async () => {};

		const policy: EntityPermissionPolicy<any> = {preWrite, queryInterceptor, preDelete};
		wireEntityPermissions(module as any, policy);

		expect(registered.preWrite).to.have.length(1);
		expect(registered.preWrite[0]).to.equal(preWrite);
		expect(registered.query).to.have.length(1);
		expect(registered.query[0]).to.equal(queryInterceptor);
		expect(registered.preDelete).to.have.length(1);
		expect(registered.preDelete[0]).to.equal(preDelete);
	});

	it('skips registration when callback is undefined', () => {
		const {registered, module} = createFakeDbModule();

		wireEntityPermissions(module as any, {});

		expect(registered.preWrite).to.have.length(0);
		expect(registered.query).to.have.length(0);
		expect(registered.preDelete).to.have.length(0);
	});

	it('registers only provided callbacks (partial policy)', () => {
		const {registered, module} = createFakeDbModule();

		const preWrite: PreWriteInterceptor = async () => {};
		wireEntityPermissions(module as any, {preWrite});

		expect(registered.preWrite).to.have.length(1);
		expect(registered.preWrite[0]).to.equal(preWrite);
		expect(registered.query).to.have.length(0);
		expect(registered.preDelete).to.have.length(0);
	});

	it('can wire multiple policies to the same module', () => {
		const {registered, module} = createFakeDbModule();

		const preWrite1: PreWriteInterceptor = async () => {};
		const preWrite2: PreWriteInterceptor = async () => {};

		wireEntityPermissions(module as any, {preWrite: preWrite1});
		wireEntityPermissions(module as any, {preWrite: preWrite2});

		expect(registered.preWrite).to.have.length(2);
		expect(registered.preWrite[0]).to.equal(preWrite1);
		expect(registered.preWrite[1]).to.equal(preWrite2);
	});

	it('wired preWrite interceptor fires with correct arguments', async () => {
		const {registered, module} = createFakeDbModule();

		let captured: {dbItem: any; original: any} | undefined;
		const preWrite: PreWriteInterceptor = async (dbItem, original) => {
			captured = {dbItem, original};
		};

		wireEntityPermissions(module as any, {preWrite});

		const ui = {_id: 'x', name: 'new'};
		const db = {_id: 'x', name: 'old'};
		await registered.preWrite[0](ui, db);

		expect(captured).to.not.be.undefined;
		expect(captured!.dbItem).to.equal(ui);
		expect(captured!.original).to.equal(db);
	});
});
