import {StorageKey} from '@nu-art/thunderstorm/frontend';
import {_SessionKey_Account, DB_Account} from '../shared';
import {HeaderKey_DeviceId, HeaderKey_TabId} from '@nu-art/thunderstorm/shared/headers';
import {SessionKey_FE} from '../../session/frontend/ModuleFE_Session';
import {TypedKeyValue} from '@nu-art/ts-common';

export const SessionKeyFE_Account = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_DeviceId = new StorageKey<string>(`storage--${HeaderKey_DeviceId}`).withstandDeletion();
export const StorageKey_TabId = new StorageKey<string>(`storage--${HeaderKey_TabId}`, false).withstandDeletion();
export const SessionKey_Account = new SessionKey_FE<TypedKeyValue<'account', DB_Account>>('account');
