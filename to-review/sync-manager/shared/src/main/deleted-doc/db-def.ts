/*
 * @nu-art/sync-manager-shared - Deleted-doc entity definition (sync-manager replica)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DBDef_V3, tsValidateMustExist} from '@nu-art/ts-common';
import {DBProto_DeletedDoc} from './types.js';

const Validator_GeneratedProps: DBProto_DeletedDoc['generatedPropsValidator'] = {};

export const DBDef_DeletedDoc: DBDef_V3<DBProto_DeletedDoc> = {
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
