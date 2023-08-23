import {filterInstances, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {PermissionKeyData} from '../shared/types';
import {ModuleBE_PermissionAccessLevel} from './modules/management/ModuleBE_PermissionAccessLevel';
import {AppConfigKey_BE} from '@nu-art/thunderstorm/backend/modules/app-config/ModuleBE_AppConfig';


export class PermissionKey_BE<K extends string>
	extends AppConfigKey_BE<TypedKeyValue<K, PermissionKeyData>> {

	static _resolver = (): Promise<PermissionKeyData> => {
		return Promise.resolve({accessLevelIds: [], _accessLevels: {}});
	};

	constructor(key: K) {
		super(key, PermissionKey_BE._resolver);
	}

	async set(value: PermissionKeyData) {
		const accessLevels = filterInstances(await ModuleBE_PermissionAccessLevel.query.all(value.accessLevelIds));
		value._accessLevels = accessLevels.reduce((acc, level) => {
			acc[level.domainId] = level.value;
			return acc;
		}, {} as TypedMap<number>);

		await super.set(value);
	}
}