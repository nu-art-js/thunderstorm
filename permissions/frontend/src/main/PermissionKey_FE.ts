import {_keys, UniqueId} from '@nu-art/ts-common';
import {DB_PermissionKeyData, DomainToLevelValueMap, PermissionKey} from '@nu-art/permissions-shared';
import {AccessLevel, ModuleFE_PermissionsAssert} from './modules/ModuleFE_PermissionsAssert.js';
import {getAppConfigKeyHandler} from './permissions-wire.js';

export type UI_PermissionKeyData = {
	accessLevelIds: UniqueId[];
	_accessLevels?: DomainToLevelValueMap
}

export class PermissionKey_FE<K extends string = string> {

	readonly key: K;

	static generatePermissionKeysByLevels = <K_ extends PermissionKey>(keysMapper: { [key in K_]: string }): { [key in K_]: PermissionKey_FE } => {
		return _keys(keysMapper).reduce((mapper, currentKey) => {
			if (!mapper[currentKey])
				mapper[currentKey] = new PermissionKey_FE(keysMapper[currentKey]) as PermissionKey_FE;
			return mapper;
		}, {} as { [key in K_]: PermissionKey_FE });
	};

	constructor(key: K) {
		this.key = key;
		ModuleFE_PermissionsAssert.registerPermissionKey(this);
	}

	get(): DB_PermissionKeyData | undefined {
		return getAppConfigKeyHandler()?.get<DB_PermissionKeyData>(this.key);
	}

	async set(value: UI_PermissionKeyData): Promise<void> {
		await getAppConfigKeyHandler()?.set(this.key, value);
	}

	getAccessLevel(): AccessLevel {
		return ModuleFE_PermissionsAssert.getAccessLevel(this);
	}
}

export type ModuleFE_PermissionMapper<Mapper> = { [key in keyof Mapper]: PermissionKey_FE };
/**
 * Permission mapper type for ModuleFEs
 */
export type ModuleFE_DefaultPermissions<UIMapper, CollectionMapper> = {
	ui: ModuleFE_PermissionMapper<UIMapper>;
	collection: ModuleFE_PermissionMapper<CollectionMapper>;
};
