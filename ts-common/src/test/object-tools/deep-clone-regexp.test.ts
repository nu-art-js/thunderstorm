/*
 * @nu-art/ts-common — deepClone RegExp preservation
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {deepClone} from '../_main.js';

describe('deepClone — RegExp', () => {
	it('clones RegExp by source and flags (not empty POJO)', () => {
		const original = /smoke/i;
		const cloned = deepClone(original);
		expect(cloned).to.be.instanceOf(RegExp);
		expect(cloned).to.not.equal(original);
		expect(cloned.source).to.equal('smoke');
		expect(cloned.flags).to.equal('i');
	});

	it('preserves nested RegExp fields', () => {
		const pattern = /knowledge/i;
		const cloned = deepClone({filter: {$regex: pattern}});
		expect(cloned.filter.$regex).to.be.instanceOf(RegExp);
		expect(cloned.filter.$regex.source).to.equal('knowledge');
		expect(cloned.filter.$regex.flags).to.equal('i');
		expect(cloned.filter.$regex).to.not.equal(pattern);
	});
});
