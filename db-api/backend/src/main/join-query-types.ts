/*
 * @nu-art/db-api-backend — Typed Mongo join query (caller passes foreign modules)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {CrudClause_OrderBy, CrudClause_Where, CrudQuery, DB_Object} from '@nu-art/db-api-shared';

/** Foreign collection module — structural type to avoid circular imports with ModuleBE_BaseDB. */
export type CrudJoinForeignModule = {
	dbDef: {dbKey: string};
	collection: unknown;
	compileQueryWhere(where?: CrudClause_Where<any>): CrudClause_Where<any> | undefined;
};

export type CrudJoinHopSpec = {
	module: CrudJoinForeignModule;
	localField: string;
	foreignField: string;
	as: string;
	where?: CrudClause_Where<any>;
};

export type CrudJoinQuerySpec<TLocal extends DB_Object = DB_Object> = {
	where?: CrudClause_Where<TLocal>;
	joins: CrudJoinHopSpec[];
	whereAfter?: CrudClause_Where<any>;
	orderBy?: CrudClause_OrderBy<TLocal>;
	limit?: CrudQuery<TLocal>['limit'];
};

export type CrudJoinRow = DB_Object & Record<string, unknown>;
