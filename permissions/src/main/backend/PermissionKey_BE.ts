import {filterInstances, TypedKeyValue, TypedMap} from '@nu-art/ts-common';
import {Const_PermissionKeyType, DB_PermissionKeyData} from '../shared/types';
import {ModuleBE_PermissionAccessLevelDB, ModuleBE_PermissionDomainDB} from './_entity';
import {AppConfigKey_BE, ModuleBE_AppConfigDB} from '@nu-art/thunderstorm/backend';

type Resolver = () => Promise<DB_PermissionKeyData>;

export class PermissionKey_BE<K extends string>
	extends AppConfigKey_BE<TypedKeyValue<K, DB_PermissionKeyData>> {

	static _resolver: Resolver = async () => {
		return {type: Const_PermissionKeyType, accessLevelIds: [], _accessLevels: {}};
	};

	static buildData = async (data: DB_PermissionKeyData): Promise<DB_PermissionKeyData> => {
		ModuleBE_AppConfigDB.logInfo('**************** Building Data ****************');
		const accessLevels = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(data.accessLevelIds));
		const _data: DB_PermissionKeyData = {
			type: 'permission-key',
			accessLevelIds: data.accessLevelIds,
			_accessLevels: accessLevels.reduce((acc, level) => {
				acc[level.domainId] = level.value;
				return acc;
			}, {} as TypedMap<number>)
		};
		ModuleBE_AppConfigDB.logInfo('**************** Data ****************');
		ModuleBE_AppConfigDB.logInfo(_data);
		return _data;
	};

	constructor(key: K, initialDataResolver?: Resolver) {
		super(key, initialDataResolver ?? PermissionKey_BE._resolver, PermissionKey_BE.buildData);
	}

	async set(value: DB_PermissionKeyData) {
		const dbValue = await PermissionKey_BE.buildData(value);
		await super.set(dbValue);
	}
}

export const defaultValueResolverV2 = async (domainId: string, accessLevelName: string): Promise<DB_PermissionKeyData> => {
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