/*
 * @nu-art/app-config-frontend - App config frontend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef_AppConfig, DatabaseDef_AppConfig, DB_AppConfig, DBDef_AppConfig, RequestBody_GetResolverByKey} from '@nu-art/app-config-shared';
import {DBConfig_ModuleFE, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCaller, HttpClient} from '@nu-art/http-client';
import {BadImplementationException, cloneObj} from '@nu-art/ts-common';
import {CrudApiDef} from '@nu-art/db-api-shared';

type InferType<T> = T extends AppConfigKey_FE<infer V> ? V : never;

const config: DBConfig_ModuleFE<DatabaseDef_AppConfig> = {
	dbKey: DBDef_AppConfig.dbKey,
	validator: DBDef_AppConfig.modifiablePropsValidator,
	uniqueKeys: (DBDef_AppConfig.uniqueKeys ?? ['_id']),
	versions: ['1.0.0'],
	dbConfig: {
		name: DBDef_AppConfig.frontend?.name ?? DBDef_AppConfig.dbKey,
		group: DBDef_AppConfig.frontend?.group ?? 'default',
		version: DBDef_AppConfig.versions[0],
		uniqueKeys: (DBDef_AppConfig.uniqueKeys ?? ['_id'])
	},
};

export class ModuleFE_AppConfig_Class
	extends ModuleFE_BaseApi<DatabaseDef_AppConfig> {

	constructor() {
		super({
			config,
			crudApiDef: CrudApiDef(DBDef_AppConfig),
			dispatcher: () => {
			}
		});
	}

	@ApiCaller(ApiDef_AppConfig._v1.getConfigByKey, {httpClient: () => HttpClient.default})
	async getConfigByKey(params: RequestBody_GetResolverByKey): Promise<unknown> {
		void params;
		return undefined as unknown;
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
		await this.delete({_id: (item as { _id: string })._id} as any);
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

