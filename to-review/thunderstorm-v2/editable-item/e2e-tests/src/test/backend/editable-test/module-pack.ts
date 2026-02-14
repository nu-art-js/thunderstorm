/*
 * @nu-art/editable-item-e2e-tests - Backend module pack for editable-test (DB + API)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_EditableTestDB} from './ModuleBE_EditableTestDB.js';

export const ModulePackBE_EditableTest = [
	ModuleBE_EditableTestDB,
	createApisForDBModule(ModuleBE_EditableTestDB, 'v1'),
];
