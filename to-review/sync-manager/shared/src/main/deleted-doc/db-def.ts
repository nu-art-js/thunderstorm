/*
 * @nu-art/sync-manager-shared - Deleted-doc entity definition (sync-manager replica)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {tsValidateMustExist} from '@nu-art/ts-common';
import {DatabaseDef_DeletedDoc} from './types.js';

const Validator_GeneratedProps: DatabaseDef_DeletedDoc['generatedPropsValidator'] = {};

export const DBDef_DeletedDoc: Database<DatabaseDef_DeletedDoc> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: '__deleted__docs',
	entityName: 'DeletedDoc',
	frontend: {
		group: 'ts-default',
		name: 'deleted-doc',
	},
	backend: {
		name: '__deleted__docs',
	},
};
