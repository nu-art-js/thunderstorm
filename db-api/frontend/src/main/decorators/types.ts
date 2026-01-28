/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, TypedApi} from '@nu-art/http-client';


/**
 * Minimal shape for CRUD API definitions passed into ModuleFE_BaseApi constructor.
 * Base does not depend on concrete API types; the app supplies its ApiDef (e.g. MyApiDef.v1).
 */
export type CrudApiDefShape = {
	query: ApiDef<TypedApi<any, any, any, any>>;
	queryUnique: ApiDef<TypedApi<any, any, any, any>>;
	upsert: ApiDef<TypedApi<any, any, any, any>>;
	upsertAll: ApiDef<TypedApi<any, any, any, any>>;
	patch: ApiDef<TypedApi<any, any, any, any>>;
	delete: ApiDef<TypedApi<any, any, any, any>>;
	deleteQuery: ApiDef<TypedApi<any, any, any, any>>;
	deleteAll: ApiDef<TypedApi<any, any, any, any>>;
};
