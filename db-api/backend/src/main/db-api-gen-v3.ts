/*
 * @nu-art/db-api-backend - Minimal DBApi def generator for backend (no thunderstorm dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {EntityDependencyError, FirestoreQuery} from '@nu-art/firebase-shared';
import type {DB_BaseObject, IndexKeys, Metadata} from '@nu-art/ts-common';
import type {BodyApi, QueryApi, ResponseError} from '@nu-art/api-types';
import {HttpMethod} from '@nu-art/api-types';
import type {CrudTypes, BaseDBDefBE} from '@nu-art/db-api-shared';

export type ApiStruct_DBApiGenIDBV3<Types extends CrudTypes> = {
	v1: {
		query: BodyApi<Types['dbItem'][], FirestoreQuery<Types['dbItem']>>;
		queryUnique: QueryApi<Types['dbItem'], DB_BaseObject, ResponseError<string, unknown>, string | IndexKeys<Types['dbItem'], keyof Types['dbItem']>>;
		upsert: BodyApi<Types['dbItem'], Types['uiItem']>;
		upsertAll: BodyApi<Types['dbItem'][], Types['uiItem'][]>;
		patch: BodyApi<Types['dbItem'], IndexKeys<Types['dbItem'], keyof Types['dbItem']> & Partial<Types['dbItem']>>;
		delete: QueryApi<Types['dbItem'] | undefined, DB_BaseObject, EntityDependencyError>;
		deleteQuery: BodyApi<Types['dbItem'][], FirestoreQuery<Types['dbItem']>>;
		deleteAll: QueryApi<Types['dbItem'][]>;
		metadata: QueryApi<Metadata<Types['dbItem']>>;
	};
};

export type ApiDefResolver_DBApiGenIDBV3<Types extends CrudTypes> = {
	v1: {
		query: { method: typeof HttpMethod.POST; path: string; timeout?: number };
		queryUnique: { method: typeof HttpMethod.GET; path: string };
		upsert: { method: typeof HttpMethod.POST; path: string };
		upsertAll: { method: typeof HttpMethod.POST; path: string };
		patch: { method: typeof HttpMethod.POST; path: string };
		delete: { method: typeof HttpMethod.GET; path: string };
		deleteQuery: { method: typeof HttpMethod.POST; path: string };
		deleteAll: { method: typeof HttpMethod.GET; path: string };
		metadata: { method: typeof HttpMethod.GET; path: string };
	};
};

export function DBApiDefGeneratorIDBV3<Types extends CrudTypes>(
	dbDef: BaseDBDefBE,
	version = 'v1'
): ApiDefResolver_DBApiGenIDBV3<Types> {
	return {
		v1: {
			query: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/query`, timeout: 60000 },
			queryUnique: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/query-unique` },
			upsert: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert` },
			upsertAll: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert-all` },
			patch: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/patch` },
			delete: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-unique` },
			deleteQuery: { method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/delete` },
			deleteAll: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-all` },
			metadata: { method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/metadata` },
		},
	};
}
