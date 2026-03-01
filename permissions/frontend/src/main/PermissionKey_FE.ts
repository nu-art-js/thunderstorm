import {AppConfigKey_FE, ModuleFE_AppConfig} from '@nu-art/app-config-frontend';
import {_keys, TypedKeyValue, UniqueId} from '@nu-art/ts-common';
import {DB_PermissionKeyData, DomainToLevelValueMap, PermissionKey} from '@nu-art/permissions-shared';
import {AccessLevel, ModuleFE_PermissionsAssert} from './modules/ModuleFE_PermissionsAssert.js';

export type UI_PermissionKeyData = {
	accessLevelIds: UniqueId[];
	_accessLevels?: DomainToLevelValueMap
}

type Binder<K extends string> = TypedKeyValue<K, DB_PermissionKeyData>;

export class PermissionKey_FE<K extends string = string>
	extends AppConfigKey_FE<Binder<K>> {

	static generatePermissionKeysByLevels = <K_ extends PermissionKey>(keysMapper: { [key in K_]: string }): { [key in K_]: PermissionKey_FE } => {
		return _keys(keysMapper).reduce((mapper, currentKey) => {
			if (!mapper[currentKey])
				mapper[currentKey] = new PermissionKey_FE(keysMapper[currentKey] as K);
			return mapper;
		}, {} as { [key in K_]: PermissionKey_FE });
	};

	constructor(key: K) {
		super(key as Binder<K>['key']);
		ModuleFE_PermissionsAssert.registerPermissionKey(this);
	}

	async set(value: UI_PermissionKeyData): Promise<void> {
		await ModuleFE_AppConfig.set(this as PermissionKey_FE<any>, value);
	}

	getAccessLevel(): AccessLevel {
		return ModuleFE_PermissionsAssert.getAccessLevel(this);
	}
}

export type ModuleFE_PermissionMapper<Mapper> = {[key in keyof Mapper]: PermissionKey_FE};
/**
 * Permission mapper type for ModuleFEs
 */
export type ModuleFE_DefaultPermissions<UIMapper, CollectionMapper> = {
	ui: ModuleFE_PermissionMapper<UIMapper>;
	collection: ModuleFE_PermissionMapper<CollectionMapper>;
};
