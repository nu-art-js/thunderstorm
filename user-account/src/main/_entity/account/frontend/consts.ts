import {BadImplementationException, TypedKeyValue} from '@thunder-storm/common';
import {StorageKey} from '@thunder-storm/core/frontend';
import {ModuleFE_Account} from './ModuleFE_Account';
import {_SessionKey_Session} from '../../session/shared';
import {_SessionKey_Account} from '../shared';
import {HeaderKey_DeviceId, HeaderKey_SessionId, HeaderKey_TabId} from '@thunder-storm/core/shared/headers';

export class SessionKey_FE<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	// @ts-ignore
	get(sessionData = ModuleFE_Account.sessionData): Binder['value'] {
		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key "${this.key}" in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const SessionKeyFE_SessionData = new SessionKey_FE<_SessionKey_Session>('session');
export const SessionKeyFE_Account = new SessionKey_FE<_SessionKey_Account>('account');
export const StorageKey_SessionId = new StorageKey<string>(`storage-${HeaderKey_SessionId}`);
export const StorageKey_DeviceId = new StorageKey<string>(`storage--${HeaderKey_DeviceId}`).withstandDeletion();
export const StorageKey_SessionTimeoutTimestamp = new StorageKey<number>(`storage-accounts__session-timeout`);
export const StorageKey_TabId = new StorageKey<string>(`storage--${HeaderKey_TabId}`, false).withstandDeletion();
