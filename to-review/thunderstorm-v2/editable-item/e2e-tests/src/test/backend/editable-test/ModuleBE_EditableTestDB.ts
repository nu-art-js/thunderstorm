/*
 * @nu-art/editable-item-e2e-tests - Test backend module for editable-test entity
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {EditableTestDB_Prototype} from '../../../shared/db-def.js';
import {editableTestDbDefBE} from '../../../shared/db-def.js';

export class ModuleBE_EditableTestDB_Class
	extends ModuleBE_BaseDB<EditableTestDB_Prototype> {

	constructor() {
		super(editableTestDbDefBE, {chunksSize: 200});
	}
}

export const ModuleBE_EditableTestDB = new ModuleBE_EditableTestDB_Class();
