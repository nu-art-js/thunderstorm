/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {UniqueId} from '@nu-art/ts-common';
import type {ResponseError} from '@nu-art/api-types';

export type DBEntityDependencyResult = { [dbKey: string]: UniqueId[] };

export type DBEntityDependencies = {
	dbKey: string;
	dependencyMap: {
		[entityId: string]: DBEntityDependencyResult;
	};
};

export const DBEntityDependencyErrorType = 'entity-has-dependencies';

export type DBEntityDependencyError = ResponseError<typeof DBEntityDependencyErrorType, DBEntityDependencies>;
