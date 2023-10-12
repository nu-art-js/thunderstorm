import {SessionKey_FE} from '../modules/ModuleFE_Account';
import {_SessionKey_Account, HeaderKey_SessionId} from '../../shared';
import {StorageKey} from '@nu-art/thunderstorm/frontend';


export const SessionKey_Account_FE = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_DeviceId = new StorageKey<string>(`storage--device-id`);
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);
