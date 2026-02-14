/*
 * @nu-art/editable-item-e2e-tests - Frontend test module for editable-test entity
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {BaseDBConfig} from '@nu-art/db-api-frontend';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {
	DBDef_EditableTest,
	editableTestValidator,
	type EditableTestCrudTypes,
} from '../../shared/db-def.js';

const editableTestBaseDBConfig: BaseDBConfig<EditableTestCrudTypes> = {
	dbKey: 'editable-test',
	validator: editableTestValidator,
	uniqueKeys: ['_id'],
	versions: ['1.0.0'],
	dbConfig: {
		name: DBDef_EditableTest.frontend.name,
		group: DBDef_EditableTest.frontend.group,
		version: 'v1',
		uniqueKeys: ['_id'],
	},
};

/**
 * Frontend module for editable-test entity. Exposes .v1 and .dbDef for compatibility
 * with @nu-art/editable-item's EditableDBItemV3 which expects storm-style module shape.
 */
export class ModuleFE_EditableTest_Class
	extends ModuleFE_BaseApi<EditableTestCrudTypes> {

	/** Compatibility with EditableDBItemV3 (expects module.v1.upsert(_item).executeSync()). */
	get v1(): {
		upsert: (item: import('../../shared/types.js').UI_EditableTest) => { executeSync: () => Promise<import('../../shared/types.js').DB_EditableTest> };
		delete: (item: import('../../shared/types.js').DB_EditableTest) => { executeSync: () => Promise<void> };
	} {
		return {
			upsert: (item) => ({ executeSync: () => this.upsert(item) }),
			delete: (item) => ({ executeSync: () => this.delete(item) }),
		};
	}

	/** Compatibility with EditableDBItemV3 hasConflicts (expects module.dbDef). */
	get dbDef(): typeof DBDef_EditableTest {
		return DBDef_EditableTest;
	}

	constructor() {
		super({
			config: editableTestBaseDBConfig,
			crudApiDef: CrudApiDef<EditableTestCrudTypes>('editable-test', 'v1'),
		});
	}
}

export const ModuleFE_EditableTest = new ModuleFE_EditableTest_Class();
