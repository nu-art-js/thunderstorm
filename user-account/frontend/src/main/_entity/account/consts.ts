import {_SessionKey_Account, DB_Account, HeaderKey_DeviceId, HeaderKey_TabId} from '@nu-art/user-account-shared';
import {SessionKey_FE} from '../session/ModuleFE_Session.js';
import {TypedKeyValue} from '@nu-art/ts-common';
import {StorageKey} from '@nu-art/thunder-core';

export const SessionKeyFE_Account = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_DeviceId = new StorageKey<string>(`storage--${HeaderKey_DeviceId}`).withstandDeletion();
export const StorageKey_TabId = new StorageKey<string>(`storage--${HeaderKey_TabId}`, false).withstandDeletion();
export const SessionKey_Account = new SessionKey_FE<TypedKeyValue<'account', DB_Account>>('account');
