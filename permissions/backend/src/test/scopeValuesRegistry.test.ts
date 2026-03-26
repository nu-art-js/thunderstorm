/*
 * @nu-art/permissions-backend - Pure unit tests for scopeValuesRegistry
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {definePermissionScope} from '@nu-art/permissions-shared';
import {getScopeValues, registerFunctionPermission} from '../main/core/function-permission-registry.js';

const scope = definePermissionScope('test-scope-registry', ['read', 'write', 'admin'] as const);

describe('scopeValuesRegistry', () => {

	it('getScopeValues returns undefined for unknown scope', () => {
		expect(getScopeValues('nonexistent-scope')).to.be.undefined;
	});

	it('stores scope values on first registerFunctionPermission call', () => {
		registerFunctionPermission(scope, 'read');
		const values = getScopeValues(scope.key);
		expect(values).to.deep.equal(['read', 'write', 'admin']);
	});

	it('returns same values on subsequent calls (stable)', () => {
		registerFunctionPermission(scope, 'write');
		registerFunctionPermission(scope, 'admin');
		const values = getScopeValues(scope.key);
		expect(values).to.deep.equal(['read', 'write', 'admin']);
	});

	it('stores values for nested scope key', () => {
		const nestedScope = definePermissionScope('org:projects', ['read', 'write'] as const);
		registerFunctionPermission(nestedScope, 'read');
		const values = getScopeValues('org:projects');
		expect(values).to.deep.equal(['read', 'write']);
	});
});
