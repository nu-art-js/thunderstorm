import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BadImplementationException, ImplementationMissingException, TS_Object, TypedKeyValue} from '@nu-art/ts-common';
import {HeaderKey} from '@nu-art/thunderstorm/backend';
import {_SessionKey_Account, _SessionKey_Session, DB_Session, HeaderKey_SessionId, HeaderKey_TabId} from '../../shared';


export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_SessionData = new MemKey<TS_Object>('session-data', true);
export const MemKey_SessionObject = new MemKey<DB_Session>('session-object', true);
export const Header_SessionId = new HeaderKey(HeaderKey_SessionId, 403);
export const Header_TabId = new HeaderKey(HeaderKey_TabId);

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
export const SessionKey_Session_BE = new SessionKey_BE<_SessionKey_Session>('session');

export async function getAuditorId() {
	const sessionData = SessionKey_Account_BE.get();

	if (!sessionData)
		throw new ImplementationMissingException('Trying to add auditorId without session data!');

	return sessionData._id;
}