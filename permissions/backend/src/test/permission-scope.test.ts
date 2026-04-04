/*
 * @nu-art/permissions-backend - Pure unit tests for definePermissionScope
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {definePermissionScope} from '@nu-art/permissions-shared';

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
