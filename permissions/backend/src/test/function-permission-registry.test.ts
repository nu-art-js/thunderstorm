/*
 * @nu-art/permissions-backend - Pure unit tests for function-permission registry
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {definePermissionScope} from '@nu-art/permissions-shared';
import {
	getFunctionPermissionDef,
	getRegisteredFunctionPermissions,
	registerFunctionPermission
} from '../main/core/function-permission-registry.js';

describe('function-permission-registry', () => {
	const scopeKey = 'test-registry-unique';
	const scope = definePermissionScope(scopeKey, ['read', 'write']);

	it('registerFunctionPermission returns def with id, scopeKey, value', () => {
		const def = registerFunctionPermission(scope, 'write');
		expect(def).to.have.property('id');
		expect(def.scopeKey).to.equal(scopeKey);
		expect(def.value).to.equal('write');
		expect(typeof def.id).to.equal('string');
		expect(def.id.length).to.be.greaterThan(0);
	});

	it('same scope and value returns same def', () => {
		const def1 = registerFunctionPermission(scope, 'read');
		const def2 = registerFunctionPermission(scope, 'read');
		expect(def1).to.equal(def2);
		expect(def1.id).to.equal(def2.id);
	});

	it('getRegisteredFunctionPermissions includes registered def', () => {
		const def = registerFunctionPermission(scope, 'read');
		const all = getRegisteredFunctionPermissions();
		expect(all).to.include(def);
	});

	it('getFunctionPermissionDef returns def for registered scopeKey and value', () => {
		const def = registerFunctionPermission(scope, 'read');
		const found = getFunctionPermissionDef(scopeKey, 'read');
		expect(found).to.equal(def);
	});

	it('getFunctionPermissionDef returns undefined for unregistered pair', () => {
		const found = getFunctionPermissionDef('nonexistent-scope-xyz', 'nonexistent');
		expect(found).to.be.undefined;
	});
});
