/*
 * @nu-art/archiving-frontend - Archiving frontend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object} from '@nu-art/ts-common';
import {Module} from '@nu-art/ts-common';
import {
	ApiDef_Archiving,
	type RequestBody_HardDeleteUnique,
	type RequestQuery_DeleteAll,
	type RequestQuery_GetHistory
} from '@nu-art/archiving-shared';
import {HttpClient} from '@nu-art/http-client';

type VoidSync = { executeSync(): Promise<void> };
type HistorySync = { executeSync(): Promise<DB_Object[]> };

class ModuleFE_Archiving_Class
	extends Module {

	readonly vv1: {
		hardDeleteAll: (params: RequestQuery_DeleteAll) => VoidSync;
		hardDeleteUnique: (body: RequestBody_HardDeleteUnique) => VoidSync;
		getDocumentHistory: (params: RequestQuery_GetHistory) => HistorySync;
	};

	private readonly httpClient?: HttpClient;

	constructor(httpClient?: HttpClient) {
		super();
		this.httpClient = httpClient;
		this.vv1 = {
			hardDeleteAll: (params: RequestQuery_DeleteAll) => ({
				executeSync: () => {
					const client = this.httpClient ?? HttpClient.default;
					if (!client)
						throw new Error('ModuleFE_Archiving: HttpClient.default must be set or pass httpClient to constructor');
					return client.createRequest(ApiDef_Archiving.vv1.hardDeleteAll).setUrlParams(params).execute();
				}
			}),
			hardDeleteUnique: (body: RequestBody_HardDeleteUnique) => ({
				executeSync: () => {
					const client = this.httpClient ?? HttpClient.default;
					if (!client)
						throw new Error('ModuleFE_Archiving: HttpClient.default must be set or pass httpClient to constructor');
					return client.createRequest(ApiDef_Archiving.vv1.hardDeleteUnique).setBodyAsJson(body).execute();
				}
			}),
			getDocumentHistory: (params: RequestQuery_GetHistory) => ({
				executeSync: () => {
					const client = this.httpClient ?? HttpClient.default;
					if (!client)
						throw new Error('ModuleFE_Archiving: HttpClient.default must be set or pass httpClient to constructor');
					return client.createRequest(ApiDef_Archiving.vv1.getDocumentHistory).setUrlParams(params).execute();
				}
			})
		};
	}
}

export const ModuleFE_Archiving = new ModuleFE_Archiving_Class();
