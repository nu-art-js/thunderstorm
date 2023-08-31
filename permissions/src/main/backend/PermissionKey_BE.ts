import {filterInstances, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {DB_PermissionKeyData} from '../shared/types';
import {ModuleBE_PermissionAccessLevel} from './modules/management/ModuleBE_PermissionAccessLevel';
import {AppConfigKey_BE, ModuleBE_AppConfig} from '@nu-art/thunderstorm/backend/modules/app-config/ModuleBE_AppConfig';

type Resolver = () => Promise<DB_PermissionKeyData>;

export class PermissionKey_BE<K extends string>
	extends AppConfigKey_BE<TypedKeyValue<K, DB_PermissionKeyData>> {

	static _resolver: Resolver = () => {
		return Promise.resolve({type: 'permission-key', accessLevelIds: [], _accessLevels: {}});
	};

	static buildData = async (data: DB_PermissionKeyData): Promise<DB_PermissionKeyData> => {
		ModuleBE_AppConfig.logInfo('**************** Building Data ****************');
		const accessLevels = filterInstances(await ModuleBE_PermissionAccessLevel.query.all(data.accessLevelIds));
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
		super(key, initialDataResolver ?? PermissionKey_BE._resolver, PermissionKey_BE.buildData);
	}

	async set(value: DB_PermissionKeyData) {
		const dbValue = await PermissionKey_BE.buildData(value);
		await super.set(dbValue);
	}
}