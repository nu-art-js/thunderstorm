import {SessionKey_FE} from '../modules/ModuleFE_Account';
import {_SessionKey_Account, HeaderKey_SessionId} from '../../shared';
import {StorageKey} from '@nu-art/thunderstorm/frontend';
import {exists, generateHex} from '@nu-art/ts-common';


export const SessionKey_Account_FE = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_DeviceId = new StorageKey<string>(`storage--device-id`);
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);

if (!exists(StorageKey_DeviceId.get())) {
	const deviceId = generateHex(32);
	console.log(`Defining new device Id: ${deviceId}`);
	StorageKey_DeviceId.set(deviceId);
}