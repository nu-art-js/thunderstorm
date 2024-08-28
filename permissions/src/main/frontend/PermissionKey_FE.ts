import {AppConfigKey_FE, ModuleFE_AppConfig} from '@thunder-storm/core/frontend';
import {_keys, TypedKeyValue} from '@thunder-storm/common';
import {DB_PermissionKeyData, PermissionKey, UI_PermissionKeyData} from '../shared/types';
import {AccessLevel, ModuleFE_PermissionsAssert} from './modules/ModuleFE_PermissionsAssert';


export class PermissionKey_FE<K extends string = string>
	extends AppConfigKey_FE<TypedKeyValue<K, DB_PermissionKeyData>> {

	static generatePermissionKeysByLevels = <K extends PermissionKey>(keysMapper: { [key in K]: string }): { [key in K]: PermissionKey_FE } => {
		return _keys(keysMapper).reduce((mapper, currentKey) => {
			if (!mapper[currentKey])
				mapper[currentKey] = new PermissionKey_FE(keysMapper[currentKey]);
			return mapper;
		}, {} as { [key in K]: PermissionKey_FE });
	};

	constructor(key: K) {
		super(key);
		ModuleFE_PermissionsAssert.registerPermissionKey(this);
	}

	async set(value: UI_PermissionKeyData) {
		// @ts-ignore
		await ModuleFE_AppConfig.set(this, value);
	}

	getAccessLevel(): AccessLevel {
		return ModuleFE_PermissionsAssert.getAccessLevel(this);
	}
}

/**
 * Permission mapper type for ModuleFEs
 */
export type ModuleFE_DefaultPermissions<UIMapper, CollectionMapper> = {
	ui: { [key in keyof UIMapper]: PermissionKey_FE },
	collection: { [key in keyof CollectionMapper]: PermissionKey_FE }
};
