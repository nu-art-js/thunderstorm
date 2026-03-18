/*
 * @nu-art/db-api-shared - Shared types for database API operations
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {UniqueId} from '@nu-art/ts-common';
import {HttpMethod} from '@nu-art/http-client';
import type {BodyApi, ApiDefResolver} from '@nu-art/http-client';
import type {DBEntityDependencies} from './entity-dependencies.js';

export type CollectionActions_Upgrade = {
	collections: {
		request: { dbKeys: string[]; force?: boolean };
		response: void;
	};
	all: {
		request: { force?: boolean };
		response: void;
	};
};

export type CollectionActions_Check = {
	usage: {
		request: { dbKey: string; itemIds: UniqueId[] };
		response: { dependencies: DBEntityDependencies | undefined };
	};
};

export type API_CollectionActions = {
	upgrade: {
		collections: BodyApi<CollectionActions_Upgrade['collections']['response'], CollectionActions_Upgrade['collections']['request']>;
		all: BodyApi<CollectionActions_Upgrade['all']['response'], CollectionActions_Upgrade['all']['request']>;
	};
	check: {
		usage: BodyApi<CollectionActions_Check['usage']['response'], CollectionActions_Check['usage']['request']>;
	};
};

export const ApiDef_CollectionActions: ApiDefResolver<API_CollectionActions> = {
	upgrade: {
		collections: {method: HttpMethod.POST, path: '/v1/collection-actions/upgrade/collections'},
		all: {method: HttpMethod.POST, path: '/v1/collection-actions/upgrade/all'},
	},
	check: {
		usage: {method: HttpMethod.POST, path: '/v1/collection-actions/check/usage'},
	},
};
