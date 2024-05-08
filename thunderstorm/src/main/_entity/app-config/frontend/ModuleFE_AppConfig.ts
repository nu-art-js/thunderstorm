import {DispatcherDef, ThunderDispatcherV3} from '../../../frontend/core/db-api-gen/types';
import {apiWithQuery} from '../../../frontend/core/typed-api';
import {ModuleFE_BaseApi} from '../../../frontend/modules/db-api-gen/ModuleFE_BaseApi';
import {ApiDefCaller} from '../../../shared/types';
import {ApiDef_AppConfig, ApiStruct_AppConfig, DBDef_AppConfig, DBProto_AppConfig, DB_AppConfig} from './shared';
import {BadImplementationException, cloneObj, TypedKeyValue} from '@nu-art/ts-common';

export type DispatcherType_AppConfig = DispatcherDef<DBProto_AppConfig, `__onAppConfigsUpdated`>;

type InferType<T> = T extends AppConfigKey_FE<infer ValueType> ? ValueType : never;

export const dispatch_onAppConfigsUpdated = new ThunderDispatcherV3<DispatcherType_AppConfig>('__onAppConfigsUpdated');

export class ModuleFE_AppConfig_Class
	extends ModuleFE_BaseApi<DBProto_AppConfig>
	implements ApiDefCaller<ApiStruct_AppConfig> {

	_v1: ApiDefCaller<ApiStruct_AppConfig>['_v1'];

	constructor() {
		super(DBDef_AppConfig, dispatch_onAppConfigsUpdated);
		this._v1 = {
			getConfigByKey: apiWithQuery(ApiDef_AppConfig._v1.getConfigByKey),
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