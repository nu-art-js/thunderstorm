/*
 * @nu-art/archiving-backend - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {Const_ArchivedCollectionPath, ModuleBE_Archiving} from '../main/ModuleBE_Archiving.js';

describe('archiving-backend', () => {
	it('Const_ArchivedCollectionPath is /_archived', () => {
		assert.equal(Const_ArchivedCollectionPath, '/_archived');
	});
	it('ModuleBE_Archiving has registerModule and handler methods', () => {
		assert.isFunction(ModuleBE_Archiving.registerModule);
		assert.isFunction(ModuleBE_Archiving.hardDeleteUnique);
		assert.isFunction(ModuleBE_Archiving.hardDeleteAll);
		assert.isFunction(ModuleBE_Archiving.getDocumentHistory);
	});
});
