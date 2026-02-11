/*
 * @nu-art/archiving-frontend - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ModuleFE_Archiving} from '../main/ModuleFE_Archiving.js';

describe('archiving-frontend', () => {
	it('ModuleFE_Archiving has vv1 with hardDeleteAll, hardDeleteUnique, getDocumentHistory', () => {
		assert.isFunction(ModuleFE_Archiving.vv1.hardDeleteAll);
		assert.isFunction(ModuleFE_Archiving.vv1.hardDeleteUnique);
		assert.isFunction(ModuleFE_Archiving.vv1.getDocumentHistory);
	});
	it('hardDeleteAll returns object with executeSync', () => {
		const result = ModuleFE_Archiving.vv1.hardDeleteAll({collectionName: 'test'});
		assert.isFunction(result.executeSync);
	});
});
