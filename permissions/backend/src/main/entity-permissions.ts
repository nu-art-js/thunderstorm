/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Prototype} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB, PreWriteInterceptor, QueryInterceptor, PreDeleteInterceptor} from '@nu-art/db-api-backend';

/**
 * Policy describing entity-level permission interceptors for a DB module.
 * All callbacks are generic — the permissions module is agnostic to the
 * assertion semantics (org, ownership, etc.). App-level code defines the callbacks.
 */
export type EntityPermissionPolicy<Database extends DB_Prototype> = {
	preWrite?: PreWriteInterceptor<Database>;
	queryInterceptor?: QueryInterceptor<Database>;
	preDelete?: PreDeleteInterceptor<Database>;
};

/**
 * Registers entity-level permission interceptors on a db-api module.
 * Interceptors run in the mandatory chain before subclass overrides — once
 * registered they cannot be bypassed by the entity module.
 *
 * Call from app-level module init to wire access control per collection.
 */
export function wireEntityPermissions<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	policy: EntityPermissionPolicy<Database>
): void {
	if (policy.preWrite)
		dbModule.registerPreWriteInterceptor(policy.preWrite);

	if (policy.queryInterceptor)
		dbModule.registerQueryInterceptor(policy.queryInterceptor);

	if (policy.preDelete)
		dbModule.registerPreDeleteInterceptor(policy.preDelete);
}
