/*
 * @nu-art/app-config-frontend - App config frontend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	API_AppConfig,
	ApiDef_AppConfig,
	ApiDef_CRUD_AppConfig,
	DatabaseDef_AppConfig,
	DB_AppConfig,
	DBDef_AppConfig,
} from '@nu-art/app-config-shared';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';
import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {BadImplementationException, cloneObj} from '@nu-art/ts-common';

type InferType<T> = T extends AppConfigKey_FE<infer V> ? V : never;

export interface OnAppConfigUpdated {
	__onAppConfigUpdated: (...params: ApiCallerEventType<DatabaseDef_AppConfig['dbType']>) => void;
}

export const dispatch_onAppConfigChanged = new ThunderDispatcher<OnAppConfigUpdated, '__onAppConfigUpdated'>('__onAppConfigUpdated');

export class ModuleFE_AppConfig_Class
	extends ModuleFE_BaseApi<DatabaseDef_AppConfig> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_AppConfig>(DBDef_AppConfig),
			crudApiDef: ApiDef_CRUD_AppConfig,
			dispatcher: (...args) => dispatch_onAppConfigChanged.dispatchAll(...args)
		});
	}

	@ApiCaller(ApiDef_AppConfig.getConfigByKey, {httpClient: () => HttpClient.default})
	async getConfigByKey(params: API_AppConfig['getConfigByKey']['Params']): Promise<API_AppConfig['getConfigByKey']['Response']> {
		void params;
		return undefined as unknown as API_AppConfig['getConfigByKey']['Response'];
	}

	get<K extends AppConfigKey_FE<any>>(appConfigKey: K): InferType<K> {
		const item = this.cache.find(c => (c as DB_AppConfig).key === appConfigKey.key);
		if (!item)
			return undefined as InferType<K>;
		return (item as DB_AppConfig).data as InferType<K>;
	}

	async set<K extends AppConfigKey_FE<any>>(appConfigKey: K, data: InferType<K>): Promise<void> {
		const item = this.cache.find(c => (c as DB_AppConfig).key === appConfigKey.key);
		let toUpsert: DatabaseDef_AppConfig['uiType'];
		if (item)
			toUpsert = cloneObj(item) as DatabaseDef_AppConfig['uiType'];
		else
			toUpsert = {key: appConfigKey.key as string, data};
		(toUpsert as { data: unknown }).data = data;
		await this.upsert(toUpsert);
	}

	async deleteByKey<K extends AppConfigKey_FE<any>>(appConfigKey: K): Promise<void> {
		const item = this.cache.find(c => (c as DB_AppConfig).key === appConfigKey.key);
		if (!item)
			throw new BadImplementationException('Config of this key does not exist');
		await this.deleteUnique({_id: (item as { _id: string })._id} as any);
	}
}

export const ModuleFE_AppConfig = new ModuleFE_AppConfig_Class();

export class AppConfigKey_FE<Binder extends { key: string; value: unknown }> {
	readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(): Binder['value'] {
		return ModuleFE_AppConfig.get(this as AppConfigKey_FE<any>) as Binder['value'];
	}

	async set(value: Binder['value']): Promise<void> {
		await ModuleFE_AppConfig.set(this as AppConfigKey_FE<any>, value);
	}

	async delete(): Promise<void> {
		await ModuleFE_AppConfig.deleteByKey(this as AppConfigKey_FE<any>);
	}
}
