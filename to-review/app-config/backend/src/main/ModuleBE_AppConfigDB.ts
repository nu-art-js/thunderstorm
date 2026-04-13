/*
 * @nu-art/app-config-backend - App config DB module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_keys, ApiException, Logger, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_AppConfig, DB_AppConfig, DBDef_AppConfig, UI_AppConfig} from '@nu-art/app-config-shared';

type InferType<T> = T extends AppConfigKey_BE<infer V> ? V : never;

export class ModuleBE_AppConfigDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_AppConfig> {

	private keyMap: TypedMap<AppConfigKey_BE<any>> = {};

	constructor() {
		super(DBDef_AppConfig);
	}

	protected async preWriteProcessing(dbInstance: UI_AppConfig, _originalDbInstance: DB_AppConfig): Promise<void> {
		const appKey = this.keyMap[dbInstance.key];
		if (!appKey)
			return;
		try {
			(dbInstance as { data: unknown }).data = await appKey.dataManipulator((dbInstance as { data: unknown }).data);
		} catch (err: unknown) {
			this.logError(`Failed to manipulate data on key ${dbInstance.key}`);
			throw err;
		}
	}

	public createDefaults = async (logger: Logger = this): Promise<void> => {
		const keys = _keys(this.keyMap);
		for (const key of keys) {
			try {
				await this.getAppKey(this.keyMap[key]);
			} catch (err: unknown) {
				logger.logError(`Failed to create app-config for key ${key}`, err as Error);
			}
		}
	};

	getResolverDataByKey = async (key: string): Promise<unknown> => {
		const appConfigKey = this.keyMap[key];
		if (!appConfigKey)
			throw new ApiException(404, `Could not find an app config with key ${key}`);
		return this.getAppKey(appConfigKey);
	};

	registerKey<K extends AppConfigKey_BE<any>>(appConfigKey: K): void {
		this.keyMap[appConfigKey.key as string] = appConfigKey;
	}

	getAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K, logger: Logger = this): Promise<InferType<K>> => {
		try {
			const items = await this.query.where({key: appConfigKey.key});
			const config = items[0];
			if (config?.data !== undefined)
				return config.data as InferType<K>;
		} catch {
			// fall through to resolver
		}
		const data = await appConfigKey.resolver(logger);
		await this.setAppKey(appConfigKey, data as InferType<K>);
		return data as InferType<K>;
	};

	setAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K, data: InferType<K>): Promise<DB_AppConfig> => {
		let existing: DB_AppConfig | undefined;
		try {
			const items = await this.query.where({key: appConfigKey.key});
			existing = items[0];
		} catch {
			// new config
		}
		const toSet: UI_AppConfig = existing
			? {...existing, data}
			: {key: appConfigKey.key as string, data};
		return this.set.item(toSet);
	};

	_deleteAppKey = async <K extends AppConfigKey_BE<any>>(appConfigKey: K): Promise<DB_AppConfig[]> => {
		return this.delete.query({where: {key: appConfigKey.key}});
	};
}

export const ModuleBE_AppConfigDB = new ModuleBE_AppConfigDB_Class();

export class AppConfigKey_BE<Binder extends { key: string | number; value: unknown }> {
	readonly key: Binder['key'];
	readonly resolver: (logger: Logger) => Promise<Binder['value']>;
	readonly dataManipulator: (data: Binder['value']) => Promise<Binder['value']>;

	constructor(
		key: Binder['key'],
		resolver: (logger: Logger) => Promise<Binder['value']>,
		dataManipulator?: (data: Binder['value']) => Promise<Binder['value']>
	) {
		this.key = key;
		this.resolver = resolver;
		this.dataManipulator = dataManipulator ?? ((data: Binder['value']) => Promise.resolve(data));
		ModuleBE_AppConfigDB.registerKey(this);
	}

	async get(): Promise<Binder['value']> {
		return ModuleBE_AppConfigDB.getAppKey(this as AppConfigKey_BE<any>) as Promise<Binder['value']>;
	}

	async set(value: Binder['value']): Promise<void> {
		await ModuleBE_AppConfigDB.setAppKey(this as AppConfigKey_BE<any>, value);
	}

	async delete(): Promise<void> {
		await ModuleBE_AppConfigDB._deleteAppKey(this as AppConfigKey_BE<any>);
	}
}
