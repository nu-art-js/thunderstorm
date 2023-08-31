import {_keys, ApiException, Logger, PreDB, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_BaseDBV2} from '../db-api-gen/ModuleBE_BaseDBV2';
import {ApiDef_AppConfig, DB_AppConfig, DBDef_AppConfigs} from '../../../shared';
import {addRoutes} from '../ModuleBE_APIs';
import {createQueryServerApi} from '../../core/typed-api';

type InferType<T> = T extends AppConfigKey_BE<infer ValueType> ? ValueType : never;

class ModuleBE_AppConfig_Class
	extends ModuleBE_BaseDBV2<DB_AppConfig> {

	private keyMap: TypedMap<AppConfigKey_BE<any>> = {};

	constructor() {
		super(DBDef_AppConfigs);
		addRoutes([createQueryServerApi(ApiDef_AppConfig.vv1.getConfigByKey, async (data) => {
			return this.getResolverDataByKey(data.key);
		})]);
	}

	protected async preWriteProcessing(dbInstance: PreDB<DB_AppConfig>, transaction?: FirebaseFirestore.Transaction): Promise<void> {
		this.logInfo('############## Pre Manipulation ##############');
		this.logInfo(dbInstance);
		const appKey = this.keyMap[dbInstance.key];
		dbInstance.data = appKey.dataManipulator(dbInstance.data);
		this.logInfo('############## Post Manipulation ##############');
		this.logInfo(dbInstance);
	}

	registerKey<K extends AppConfigKey_BE<any>>(appConfigKey: K) {
		this.keyMap[appConfigKey.key] = appConfigKey;
	}

	getResolverDataByKey(key: string) {
		const appConfigKey = this.keyMap[key];
		if (!appConfigKey)
			throw new ApiException(404, `Could not find an app config with key ${key}`);

		return this.getAppKey(appConfigKey);
	}

	public createDefaults = async (logger: Logger = this) => {
		const keys = _keys(this.keyMap);
		for (const key of keys) {
			const config = await this.getAppKey(this.keyMap[key]);
			this.logInfo(`Set default data for key ${key}`);
			this.logInfo(config);
		}
	};

	async getAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K): Promise<InferType<K>> {
		try {
			const config = await this.query.uniqueCustom({where: {key: appConfigKey.key}});
			return config?.data as InferType<K>;
		} catch (e) {
			const data = await appConfigKey.resolver();
			await this.setAppKey(appConfigKey, data);
			return data;
		}
	}

	async setAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K, data: InferType<K>) {
		let _config;
		try {
			_config = await this.query.uniqueCustom({where: {key: appConfigKey.key}});
		} catch (e: any) {
			_config = {key: appConfigKey.key} as DB_AppConfig;
		}
		_config.data = data;
		return this.set.item(_config);
	}

	async _deleteAppKey<K extends AppConfigKey_BE<any>>(appConfigKey: K) {
		await this.delete.query({where: {key: appConfigKey.key}});
	}
}

export const ModuleBE_AppConfig = new ModuleBE_AppConfig_Class();

//TODO: Add validation by key
export class AppConfigKey_BE<Binder extends TypedKeyValue<string | number | object, any>> {
	readonly key: Binder['key'];
	readonly resolver: () => Promise<Binder['value']>;
	readonly dataManipulator: (data: Binder['value']) => Promise<Binder['value']> = (data) => data;

	constructor(key: Binder['key'], resolver: () => Promise<Binder['value']>, dataManipulator?: (data: Binder['value']) => Promise<Binder['value']>) {
		this.key = key;
		this.resolver = resolver;
		if (dataManipulator)
			this.dataManipulator = dataManipulator;
		ModuleBE_AppConfig.registerKey(this);
	}

	async get(): Promise<Binder['value']> {
		return await ModuleBE_AppConfig.getAppKey(this);
	}

	async set(value: Binder['value']) {
		// @ts-ignore
		await ModuleBE_AppConfig.setAppKey(this, value);
	}

	async delete() {
		await ModuleBE_AppConfig._deleteAppKey(this);
	}
}