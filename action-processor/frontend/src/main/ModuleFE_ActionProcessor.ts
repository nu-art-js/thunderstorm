/*
 * @nu-art/action-processor-frontend - Action processor frontend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {ApiDef_ActionProcessing, Request_ActionToProcess, ActionMetaData} from '@nu-art/action-processor-shared';
import {HttpClient} from '@nu-art/http-client';

type ExecuteSync = { executeSync(): Promise<void> };
type ListSync = { executeSync(): Promise<ActionMetaData[]> };

class ModuleFE_ActionProcessor_Class
	extends Module {

	readonly vv1: {
		execute: (payload: Request_ActionToProcess) => ExecuteSync;
		list: (params?: Record<string, string | number | boolean | undefined>) => ListSync;
	};

	private readonly httpClient?: HttpClient;

	constructor(httpClient?: HttpClient) {
		super();
		this.httpClient = httpClient;
		this.vv1 = {
			execute: (payload: Request_ActionToProcess) => ({
				executeSync: () => {
					const client = this.httpClient ?? HttpClient.default;
					if (!client)
						throw new Error('ModuleFE_ActionProcessor: HttpClient.default must be set or pass httpClient to constructor');
					return client.createRequest(ApiDef_ActionProcessing.vv1.execute).setBodyAsJson(payload).execute();
				},
			}),
			list: (params?: Record<string, string | number | boolean | undefined>) => ({
				executeSync: () => {
					const client = this.httpClient ?? HttpClient.default;
					if (!client)
						throw new Error('ModuleFE_ActionProcessor: HttpClient.default must be set or pass httpClient to constructor');
					return client.createRequest(ApiDef_ActionProcessing.vv1.list).setUrlParams(params ?? {}).execute();
				},
			}),
		};
	}
}

export const ModuleFE_ActionProcessor = new ModuleFE_ActionProcessor_Class();
