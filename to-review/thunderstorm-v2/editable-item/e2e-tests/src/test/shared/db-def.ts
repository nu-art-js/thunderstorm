/*
 * @nu-art/editable-item-e2e-tests - Shared test entity db-def
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {tsValidateString} from '@nu-art/ts-common';
import type {BaseDBDefBE} from '@nu-art/db-api-backend';
import type {DatabaseDef_EditableTest, DB_EditableTest, UI_EditableTest} from './types.js';

const Validator_ModifiableProps: DatabaseDef_EditableTest['modifiablePropsValidator'] = {
	a: tsValidateString(),
	b: tsValidateString(),
	c: tsValidateString(),
	d: tsValidateString(),
};

const Validator_GeneratedProps: DatabaseDef_EditableTest['generatedPropsValidator'] = {};

export const DBDef_EditableTest: Database<DatabaseDef_EditableTest> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'editable-test',
	entityName: 'editable-test',
	frontend: {
		group: 'test',
		name: 'editable-test',
	},
	backend: {
		name: 'editable-test',
	},
};

/** BaseDBDefBE-compatible def for ModuleBE_BaseDB (db-api-backend). */
export const editableTestDbDefBE: BaseDBDefBE = {
	dbKey: 'editable-test',
	entityName: 'editable-test',
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
};

/** Validator for test entity (accepts any UI item). */
export const editableTestValidator: (item?: UI_EditableTest) => undefined = () => undefined;

/** DB_Prototype for editable-test entity (ModuleBE_BaseDB / ModuleFE_BaseApi). */
export type EditableTestDB_Prototype = DatabaseDef_EditableTest;
