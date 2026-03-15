/*
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	ApiDef_ShortUrl,
	DBDef_ShortUrl,
	DatabaseDef_ShortUrl,
	GetShortUrlRequest,
	GetShortUrlResponse
} from '@nu-art/ts-short-url-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {ApiCaller} from '@nu-art/http-client';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {DBConfig_ModuleFE, EventDispatcher, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';

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

function shortUrlConfig(): DBConfig_ModuleFE<DatabaseDef_ShortUrl> {
	return {
		dbKey: DBDef_ShortUrl.dbKey,
		validator: DBDef_ShortUrl.modifiablePropsValidator,
		uniqueKeys: DBDef_ShortUrl.uniqueKeys ?? [],
		versions: DBDef_ShortUrl.versions,
		dbConfig: {
			...DBDef_ShortUrl.frontend,
			version: DBDef_ShortUrl.versions[0] ?? '1.0.0',
			uniqueKeys: DBDef_ShortUrl.uniqueKeys ?? ['_id']
		}
	};
}

export class ModuleFE_ShortUrl_Class extends ModuleFE_BaseApi<DatabaseDef_ShortUrl> {

	constructor() {
		super({
			config: shortUrlConfig(),
			crudApiDef: CrudApiDef<DatabaseDef_ShortUrl>(DBDef_ShortUrl.dbKey),
			dispatcher: dispatch_onShortUrlsUpdated
		});
	}

	@ApiCaller(ApiDef_ShortUrl.getShortUrl)
	async getShortUrl(params: GetShortUrlRequest): Promise<GetShortUrlResponse> {
		void params;
		return undefined as unknown as GetShortUrlResponse;
	}
}

export const ModuleFE_ShortUrl = new ModuleFE_ShortUrl_Class();
