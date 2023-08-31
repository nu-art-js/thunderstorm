import {AppConfigKey_FE, ModuleFE_AppConfig} from '@nu-art/thunderstorm/frontend';
import {TypedKeyValue} from '@nu-art/ts-common';
import {DB_PermissionKeyData, UI_PermissionKeyData} from '../shared/types';
import {ModuleFE_PermissionsAssert} from './modules/ModuleFE_PermissionsAssert';


export class PermissionKey_FE<K extends string = string>
	extends AppConfigKey_FE<TypedKeyValue<K, DB_PermissionKeyData>> {

	constructor(key: K) {
		super(key);
		ModuleFE_PermissionsAssert.registerPermissionKey(this);
	}

	async set(value: UI_PermissionKeyData) {
		// @ts-ignore
		await ModuleFE_AppConfig.set(this, value);
	}
}