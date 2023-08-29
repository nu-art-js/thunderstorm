import {AppConfigKey_FE} from '@nu-art/thunderstorm/frontend';
import {TypedKeyValue} from '@nu-art/ts-common';
import {DB_PermissionKeyData, UI_PermissionKeyData} from '../shared/types';


export class PermissionKey_FE<K extends string = string>
	extends AppConfigKey_FE<TypedKeyValue<K, DB_PermissionKeyData>> {

	async set(value: UI_PermissionKeyData) {
		// @ts-ignore
		await ModuleFE_AppConfig.set(this, value);
	}
}