import {filterInstances, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {DB_PermissionKeyData, UI_PermissionKeyData} from '../shared/types';
import {ModuleBE_PermissionAccessLevel} from './modules/management/ModuleBE_PermissionAccessLevel';
import {AppConfigKey_BE} from '@nu-art/thunderstorm/backend/modules/app-config/ModuleBE_AppConfig';

type Resolver = () => Promise<DB_PermissionKeyData>;

export class PermissionKey_BE<K extends string>
	extends AppConfigKey_BE<TypedKeyValue<K, DB_PermissionKeyData>> {

	static _resolver: Resolver = () => {
		return Promise.resolve({type: 'permission-key', accessLevelIds: [], _accessLevels: {}});
	};

	constructor(key: K, initialDataResolver?: Resolver) {
		super(key, initialDataResolver ?? PermissionKey_BE._resolver);
	}

	async set(value: UI_PermissionKeyData) {
		const accessLevels = filterInstances(await ModuleBE_PermissionAccessLevel.query.all(value.accessLevelIds));

		const dbValue = {
			type: 'permission-key' as const,
			accessLevelIds: value.accessLevelIds,
			_accessLevels: accessLevels.reduce((acc, level) => {
				acc[level.domainId] = level.value;
				return acc;
			}, {} as TypedMap<number>)
		};

		await super.set(dbValue);
	}
}