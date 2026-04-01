/*
 * @nu-art/permissions-backend - Pure unit tests for definePermissionScope and toScopeEntityId
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {md5} from '@nu-art/ts-common';
import {definePermissionScope, toScopeEntityId} from '@nu-art/permissions-shared';

describe('definePermissionScope', () => {
	it('returns frozen object with key and values', () => {
		const scope = definePermissionScope('pathway', ['read', 'write']);
		expect(scope.key).to.equal('pathway');
		expect(scope.values).to.deep.equal(['read', 'write']);
		expect(Object.isFrozen(scope)).to.be.true;
	});

	it('same key and values returns equivalent structure', () => {
		const a = definePermissionScope('pathway', ['read', 'write']);
		const b = definePermissionScope('pathway', ['read', 'write']);
		expect(a.key).to.equal(b.key);
		expect(a.values).to.deep.equal(b.values);
	});
});

describe('toScopeEntityId', () => {
	it('produces deterministic ID from scope key and value', () => {
		const id1 = toScopeEntityId('articles', 'read');
		const id2 = toScopeEntityId('articles', 'read');
		expect(id1).to.equal(id2);
	});

	it('ID is derived from md5 of key:value', () => {
		const id = toScopeEntityId('articles', 'write');
		const expectedHash = md5('articles:write');
		expect(id).to.equal(expectedHash);
	});

	it('different values produce different IDs', () => {
		const readId = toScopeEntityId('articles', 'read');
		const writeId = toScopeEntityId('articles', 'write');
		expect(readId).to.not.equal(writeId);
	});

	it('different scope keys produce different IDs', () => {
		const articlesId = toScopeEntityId('articles', 'read');
		const topicsId = toScopeEntityId('topics', 'read');
		expect(articlesId).to.not.equal(topicsId);
	});
});
