import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BadImplementationException, ImplementationMissingException, RecursiveObjectOfPrimitives, TypedKeyValue} from '@nu-art/ts-common';
import {DB_Session} from '../shared/index.js';
import {HeaderKey} from '@nu-art/thunderstorm/backend/index';
import {_SessionKey_Account} from '../../account/shared/index.js';
import {HeaderKey_Authorization, HeaderKey_DeviceId, HeaderKey_Origin, HeaderKey_TabId} from '@nu-art/thunderstorm/shared/headers';

export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_AccountType = new MemKey<string>('accounts--type', true);

export const MemKey_DB_Session = new MemKey<DB_Session>('db-session-object', false);
export const MemKey_SessionData = new MemKey<RecursiveObjectOfPrimitives>('jwt-claims', false);
export const MemKey_Jwt = new MemKey<string>('jwt-token', false);

export const Header_Authorization = new HeaderKey(HeaderKey_Authorization, 403);
export const Header_Origin = new HeaderKey(HeaderKey_Origin, 403);
export const Header_TabId = new HeaderKey(HeaderKey_TabId);
export const Header_DeviceId = new HeaderKey(HeaderKey_DeviceId);

export class SessionKey_BE<Binder extends TypedKeyValue<string | number, any>> {
	private readonly key: Binder['key'];

	constructor(key: Binder['key']) {
		this.key = key;
	}

	get(sessionData = MemKey_SessionData.get()): Binder['value'] {
		if (!(this.key in sessionData))
			throw new BadImplementationException(`Couldn't find key "${this.key}" in session data`);

		return sessionData[this.key] as Binder['value'];
	}
}

export const SessionKey_Account_BE = new SessionKey_BE<_SessionKey_Account>('account');

export async function getAuditorId() {
	const sessionData = SessionKey_Account_BE.get();

	if (!sessionData)
		throw new ImplementationMissingException('Trying to add auditorId without session data!');

	return sessionData._id;
}