import {SessionKey_FE} from '../modules/ModuleFE_Account';
import {_SessionKey_Account, _SessionKey_Session, HeaderKey_SessionId} from '../../shared';
import {StorageKey} from '@nu-art/thunderstorm/frontend';


export const SessionKeyFE_SessionData = new SessionKey_FE<_SessionKey_Session>('session');
export const SessionKeyFE_Account = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_DeviceId = new StorageKey<string>(`storage--device-id`).withstandDeletion();
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);
export const StorageKey_TabId = new StorageKey<string>(`storage--tab-id`, false);
