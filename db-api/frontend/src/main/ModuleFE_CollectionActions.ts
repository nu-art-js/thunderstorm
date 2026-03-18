/*
 * @nu-art/db-api-frontend - Frontend caller for collection-level actions
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {HttpClient} from '@nu-art/http-client';
import type {ApiDef, ApiDefCaller, GeneralApi} from '@nu-art/http-client';
import type {API_CollectionActions} from '@nu-art/db-api-shared';
import {ApiDef_CollectionActions} from '@nu-art/db-api-shared';

function bodyCaller<API extends GeneralApi>(apiDef: ApiDef<API>): (body: API['Body']) => Promise<API['Response']> {
	return (body: API['Body']) =>
		HttpClient.default.createRequest(apiDef).setBodyAsJson(body).execute();
}

class ModuleFE_CollectionActions_Class
	extends Module {
	readonly upgrade: ApiDefCaller<API_CollectionActions['upgrade']>;
	readonly check: ApiDefCaller<API_CollectionActions['check']>;

	constructor() {
		super();
		this.upgrade = {
			collections: bodyCaller(ApiDef_CollectionActions.upgrade.collections),
			all: bodyCaller(ApiDef_CollectionActions.upgrade.all),
		} as ApiDefCaller<API_CollectionActions['upgrade']>;
		this.check = {
			usage: bodyCaller(ApiDef_CollectionActions.check.usage),
		} as ApiDefCaller<API_CollectionActions['check']>;
	}
}

export const ModuleFE_CollectionActions = new ModuleFE_CollectionActions_Class();
