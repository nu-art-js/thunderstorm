/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {BadImplementationException, cloneObj, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {
	ApiDef_AppConfig,
	ApiDefCaller,
	ApiStruct_AppConfig,
	DB_AppConfig,
	DBDef_AppConfigs,
} from '../../shared';
import {ApiCallerEventType} from '../../core/db-api-gen/types';
import {ModuleFE_BaseApi} from '../db-api-gen/ModuleFE_BaseApi';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {apiWithQuery} from '../../core/typed-api';
import {Response_DBSync} from '../../../shared/sync-manager/types';


type InferType<T> = T extends AppConfigKey_FE<infer ValueType> ? ValueType : never;

export interface OnAppConfigUpdated {
	__OnAppConfigUpdated: (...params: ApiCallerEventType<DB_AppConfig>) => void;
}

export const dispatch_onAppConfigUpdated = new ThunderDispatcher<OnAppConfigUpdated, '__OnAppConfigUpdated'>('__OnAppConfigUpdated');

class ModuleFE_AppConfig_Class
	extends ModuleFE_BaseApi<DB_AppConfig, 'key'> {
	readonly vv1: ApiDefCaller<ApiStruct_AppConfig>['vv1'];

	appConfig: TypedMap<DB_AppConfig> = {};

	constructor() {
		super(DBDef_AppConfigs, dispatch_onAppConfigUpdated);
		this.vv1 = {
			getConfigByKey: apiWithQuery(ApiDef_AppConfig.vv1.getConfigByKey),
		};

		const _onSyncCompleted = this.onSyncCompleted;
		this.onSyncCompleted = async (syncData: Response_DBSync<DB_AppConfig>) => {
			await _onSyncCompleted(syncData);
			const dbConfigs = this.cache.all();
			dbConfigs.forEach(dbConfig => this.appConfig[dbConfig.key] = dbConfig);
		};
	}

	async init() {
		super.init();
	}

	get<K extends AppConfigKey_FE<any>>(appConfigKey: K): InferType<K> {
		const config = this.cache.find(item => item.key === appConfigKey.key)!;
		return config?.data as InferType<K>;
	}

	async set<K extends AppConfigKey_FE<any>>(appConfigKey: K, data: InferType<K>) {
		let _config: DB_AppConfig = cloneObj(this.cache.find(item => item.key === appConfigKey.key)!);
		if (!_config)
			_config = {key: appConfigKey.key} as DB_AppConfig;

		_config.data = data;
		await this.v1.upsert(_config).executeSync();
	}

	async delete<K extends AppConfigKey_FE<any>>(appConfigKey: K) {
		const config = this.cache.find(item => item.key === appConfigKey.key);
		if (!config)
			throw new BadImplementationException('Config of this key does not exist');

		await this.v1.delete(config).executeSync();
	}
}

export const ModuleFE_AppConfig = new ModuleFE_AppConfig_Class();

export class AppConfigKey_FE<Binder extends TypedKeyValue<string, any>> {
	readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(): Binder['value'] {
		return ModuleFE_AppConfig.get(this) as Binder['value'];
	}

	async set(value: Binder['value']) {
		// @ts-ignore
		await ModuleFE_AppConfig.set(this, value);
	}

	async delete() {
		await ModuleFE_AppConfig.delete(this);
	}
}