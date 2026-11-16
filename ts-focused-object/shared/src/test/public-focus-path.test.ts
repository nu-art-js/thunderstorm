/*
 * @nu-art/ts-focused-object-shared - Public focus path
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {getRelationalPath} from '../main/consts.js';

describe('focused object path', () => {
	it('listens and writes under /public', () => {
		// Example: /public/state/ModuleBE_FocusedObject/focusedData/
		expect(getRelationalPath()).to.equal('/public/state/ModuleBE_FocusedObject/focusedData/');
	});
});
