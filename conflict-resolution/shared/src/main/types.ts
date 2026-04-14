/*
 * @nu-art/conflict-resolution-shared - Conflict resolution item and renderer types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import type {UniqueId} from '@nu-art/ts-common';
import {DB_Prototype} from '@nu-art/db-api-shared';

/** Same shape as @nu-art/db-api-backend DBEntityDependencies; used by frontend without depending on backend. */
export type DBEntityDependencyResult = { [dbKey: string]: UniqueId[] };

export type DBEntityDependencies = {
	dbKey: string;
	dependencyMap: {
		[entityId: UniqueId]: DBEntityDependencyResult;
	};
};

export const DBEntityDependencyErrorType = 'entity-has-dependencies';

export type ConflictResolutionItem<Proto extends DB_Prototype> = {
	//Key of the DBEntity
	dbKey: Proto['dbKey'];
	//What will be rendered in the conflict resolution panel
	renderer: (instance: Proto['dbType']) => React.ReactNode | undefined;
	//How we render the dbKey in the conflict resolution panel
	collectionRenderer: (dbKey: Proto['dbKey']) => React.ReactNode | undefined;
	//What we filter by in the conflict resolution panel
	filterMapper: (instance: Proto['dbType']) => string[];
}