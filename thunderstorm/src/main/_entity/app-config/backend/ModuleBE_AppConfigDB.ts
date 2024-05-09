import {DBApiConfigV3, ModuleBE_BaseDB} from '../../../backend/modules/db-api-gen/ModuleBE_BaseDB';
import {DBDef_AppConfig, DBProto_AppConfig, DB_AppConfig} from './shared';
import {_keys, ApiException, Logger, PreDB, TypedKeyValue, TypedMap} from '@nu-art/ts-common';

type InferType<T> = T extends AppConfigKey_BE<infer ValueType> ? ValueType : never;
type Config = DBApiConfigV3<DBProto_AppConfig> & {}

export class ModuleBE_AppConfigDB_Class
	extends ModuleBE_BaseDB<DBProto_AppConfig, Config> {

	private keyMap: TypedMap<AppConfigKey_BE<any>> = {};

	// ######################## Lifecycle ########################

	constructor() {
		super(DBDef_AppConfig);
	}

	protected async preWriteProcessing(dbInstance: PreDB<DB_AppConfig>, transaction?: FirebaseFirestore.Transaction): Promise<void> {
		this.logInfo('############## Pre Manipulation ##############');
		this.logInfo(dbInstance);
		const appKey = this.keyMap[dbInstance.key];
		dbInstance.data = await appKey.dataManipulator(dbInstance.data);
		this.logInfo('############## Post Manipulation ##############');
		this.logInfo(dbInstance);
	}

	public createDefaults = async (logger: Logger = this) => {
		const keys = _keys(this.keyMap);
		for (const key of keys) {
			const config = await this.getAppKey(this.keyMap[key]);
			this.logInfo(`Set App-Config default value for '${key}'`, config);
		}
	};

	// ######################## API ########################

	getResolverDataByKey = async (key: string) => {
		const appConfigKey = this.keyMap[key];
		if (!appConfigKey)
			throw new ApiException(404, `Could not find an app config with key ${key}`);

		return this.getAppKey(appConfigKey);
	};

	// ######################## Logic ########################

	registerKey<K extends AppConfigKey_BE<any>>(appConfigKey: K) {
		this.keyMap[appConfigKey.key] = appConfigKey;
	}

	getAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K): Promise<InferType<K>> => {
		try {
			const config = await this.query.uniqueCustom({where: {key: appConfigKey.key}});
			return config?.data as InferType<K>;
		} catch (e) {
			const data = await appConfigKey.resolver();
			await this.setAppKey(appConfigKey, data);
			return data;
		}
	};

	setAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K, data: InferType<K>) => {
		let _config;
		try {
			_config = await this.query.uniqueCustom({where: {key: appConfigKey.key}});
		} catch (e: any) {
			_config = {key: appConfigKey.key} as DB_AppConfig;
		}
		_config.data = data;
		return this.set.item(_config);
	};

	_deleteAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K) => {
		await this.delete.query({where: {key: appConfigKey.key}});
	};
}

export const ModuleBE_AppConfigDB = new ModuleBE_AppConfigDB_Class();

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
		ModuleBE_AppConfigDB.registerKey(this);
	}


	async get(): Promise<Binder['value']> {
		return await ModuleBE_AppConfigDB.getAppKey(this);
	}

	async set(value: Binder['value']) {
		// @ts-ignore
		await ModuleBE_AppConfig.setAppKey(this, value);
	}

	async delete() {
		await ModuleBE_AppConfigDB._deleteAppKey(this);
	}
}