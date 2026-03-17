/*
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	API_ShortUrl,
	ApiDef_ShortUrl,
	DBDef_ShortUrl,
	DatabaseDef_ShortUrl,
} from '@nu-art/ts-short-url-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {ApiCaller} from '@nu-art/http-client';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {buildConfigFromDBDef, EventDispatcher, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';

export type DispatcherType_ShortUrl = `__onShortUrlsUpdated`;

const listeners: Array<EventDispatcher<DatabaseDef_ShortUrl['dbType']>> = [];
export const dispatch_onShortUrlsUpdated = Object.assign(
	((...params: ApiCallerEventType<DatabaseDef_ShortUrl['dbType']>) => {
		listeners.forEach(fn => fn(...params));
	}) as EventDispatcher<DatabaseDef_ShortUrl['dbType']>,
	{
		addListener(fn: EventDispatcher<DatabaseDef_ShortUrl['dbType']>) {
			listeners.push(fn);
		}
	}
);

export class ModuleFE_ShortUrl_Class extends ModuleFE_BaseApi<DatabaseDef_ShortUrl> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_ShortUrl>(DBDef_ShortUrl),
			crudApiDef: CrudApiDef<DatabaseDef_ShortUrl>(DBDef_ShortUrl.dbKey),
			dispatcher: dispatch_onShortUrlsUpdated
		});
	}

	@ApiCaller(ApiDef_ShortUrl.getShortUrl)
	async getShortUrl(params: API_ShortUrl['getShortUrl']['Params']): Promise<API_ShortUrl['getShortUrl']['Response']> {
		void params;
		return undefined as unknown as API_ShortUrl['getShortUrl']['Response'];
	}
}

export const ModuleFE_ShortUrl = new ModuleFE_ShortUrl_Class();
