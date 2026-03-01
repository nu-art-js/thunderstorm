import {filterInstances, Logger, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_PermissionAccessLevelDB, ModuleBE_PermissionDomainDB} from './_entity.js';
import {getAppConfigKeyHandler} from './permissions-wire.js';
import {Const_PermissionKeyType, DatabaseDef_PermissionDomain, DB_PermissionKeyData} from '@nu-art/permissions-shared';

type Resolver = (logger?: Logger) => Promise<DB_PermissionKeyData>;

export class PermissionKey_BE<K extends string> {

	readonly key: K;
	readonly resolver: Resolver;
	readonly dataManipulator: (data: DB_PermissionKeyData) => Promise<DB_PermissionKeyData>;

	static _resolver: Resolver = async () => {
		return {type: Const_PermissionKeyType, accessLevelIds: [], _accessLevels: {}};
	};

	static buildData = async (data: DB_PermissionKeyData): Promise<DB_PermissionKeyData> => {
		const accessLevels = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(data.accessLevelIds));
		return {
			type: 'permission-key',
			accessLevelIds: data.accessLevelIds,
			_accessLevels: accessLevels.reduce((acc, level) => {
				acc[level.domainId] = level.value;
				return acc;
			}, {} as TypedMap<number>)
		};
	};

	constructor(key: K, initialDataResolver?: Resolver) {
		this.key = key;
		this.resolver = initialDataResolver ?? PermissionKey_BE._resolver;
		this.dataManipulator = PermissionKey_BE.buildData;
		getAppConfigKeyHandler()?.registerKey(this as unknown as { key: string | number; resolver: (logger: Logger) => Promise<unknown>; dataManipulator: (data: unknown) => Promise<unknown> });
	}

	async get(): Promise<DB_PermissionKeyData> {
		const handler = getAppConfigKeyHandler();
		if (!handler)
			throw new Error('AppConfigKeyHandler not set; wire setAppConfigKeyHandler(ModuleBE_AppConfigDB) when using app-config-backend');
		return handler.getAppKey(this) as Promise<DB_PermissionKeyData>;
	}

	async set(value: DB_PermissionKeyData): Promise<void> {
		const dbValue = await PermissionKey_BE.buildData(value);
		const handler = getAppConfigKeyHandler();
		if (!handler)
			throw new Error('AppConfigKeyHandler not set; wire setAppConfigKeyHandler(ModuleBE_AppConfigDB) when using app-config-backend');
		await handler.setAppKey(this, dbValue);
	}
}

export const defaultValueResolverV2 = async (domainId: DatabaseDef_PermissionDomain['id'], accessLevelName: string): Promise<DB_PermissionKeyData> => {
	const accessLevel = await ModuleBE_PermissionAccessLevelDB.query.uniqueCustom({where: {domainId, name: accessLevelName}});
	return {
		type: Const_PermissionKeyType,
		accessLevelIds: [accessLevel._id],
		_accessLevels: {[accessLevel._id]: accessLevel.value}
	};
};

export const defaultValueResolver = async (domainNamespace: string, accessLevelValue: number): Promise<DB_PermissionKeyData> => {
	const domain = await ModuleBE_PermissionDomainDB.query.uniqueCustom({where: {namespace: domainNamespace}});
	const accessLevel = await ModuleBE_PermissionAccessLevelDB.query.uniqueCustom({where: {domainId: domain._id, value: accessLevelValue}});
	return {
		type: Const_PermissionKeyType,
		accessLevelIds: [accessLevel._id],
		_accessLevels: {[accessLevel._id]: accessLevel.value}
	};
};
