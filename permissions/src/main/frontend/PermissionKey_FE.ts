import {AppConfigKey_FE} from '@nu-art/thunderstorm/frontend';
import {TypedKeyValue} from '@nu-art/ts-common';
import {PermissionKeyData} from '../shared/types';

export class PermissionKey_FE<K extends string>
	extends AppConfigKey_FE<TypedKeyValue<K, PermissionKeyData>> {
}