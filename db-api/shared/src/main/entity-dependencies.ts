/*
 * @nu-art/db-api-shared - Shared types for database API operations
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {UniqueId} from '@nu-art/ts-common';
import type {ResponseError} from '@nu-art/ts-common/core/exceptions/types';

export type DBEntityDependencyResult = { [dbKey: string]: UniqueId[] };

export type DBEntityDependencies = {
	dbKey: string;
	dependencyMap: {
		[entityId: UniqueId]: DBEntityDependencyResult;
	};
};

export const DBEntityDependencyErrorType = 'entity-has-dependencies';

export type DBEntityDependencyError = ResponseError<typeof DBEntityDependencyErrorType, DBEntityDependencies>;
