/*
 * @nu-art/db-api-backend - Minimal DBApi def generator for backend (no thunderstorm dependency)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {EntityDependencyError, FirestoreQuery} from '@nu-art/firebase-shared';
import type {DB_BaseObject, DBDef_V3, DBProto, IndexKeys, Metadata} from '@nu-art/ts-common';
import {HttpMethod} from '@nu-art/api-types';
import type {BodyApi, QueryApi, ResponseError} from '@nu-art/api-types';

export type ApiStruct_DBApiGenIDBV3<Proto extends DBProto<any>> = {
	v1: {
		query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
		queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, ResponseError<string, unknown>, string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>>;
		upsert: BodyApi<Proto['dbType'], Proto['uiType']>;
		upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>;
		patch: BodyApi<Proto['dbType'], IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Partial<Proto['dbType']>>;
		delete: QueryApi<Proto['dbType'] | undefined, DB_BaseObject, EntityDependencyError>;
		deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>;
		deleteAll: QueryApi<Proto['dbType'][]>;
		metadata: QueryApi<Metadata<Proto['dbType']>>;
	};
};

export type ApiDefResolver_DBApiGenIDBV3<Proto extends DBProto<any>> = {
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

export function DBApiDefGeneratorIDBV3<Proto extends DBProto<any>>(
	dbDef: DBDef_V3<Proto>,
	version = 'v1'
): ApiDefResolver_DBApiGenIDBV3<Proto> {
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
