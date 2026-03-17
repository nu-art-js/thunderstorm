/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {tsValidateString} from '@nu-art/ts-common';
import type {DatabaseDef_EditableTest} from './types.js';

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
	frontend: {group: 'test', name: 'editable-test'},
	backend: {name: 'editable-test'},
};
