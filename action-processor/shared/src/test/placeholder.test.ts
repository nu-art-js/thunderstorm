/*
 * @nu-art/action-processor-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import type {Request_ActionToProcess, ActionMetaData} from '../main/apis.js';

describe('action-processor-shared', () => {
	it('Request_ActionToProcess has key', () => {
		const r: Request_ActionToProcess = {key: 'test'};
		assert.equal(r.key, 'test');
	});
	it('ActionMetaData has key, description, group', () => {
		const m: ActionMetaData = {key: 'k', description: 'd', group: 'g'};
		assert.equal(m.key, 'k');
		assert.equal(m.description, 'd');
		assert.equal(m.group, 'g');
	});
});
