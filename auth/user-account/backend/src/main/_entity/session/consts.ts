import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BadImplementationException, ImplementationMissingException, RecursiveObjectOfPrimitives, TypedKeyValue} from '@nu-art/ts-common';
import {HeaderKey_Authorization, HeaderKey_Origin} from '@nu-art/api-types';
import {HeaderKey} from '@nu-art/http-server';
import {_SessionKey_Account, DatabaseDef_Account, DB_Session, HeaderKey_DeviceId, HeaderKey_TabId} from '@nu-art/user-account-shared';

export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<DatabaseDef_Account['id']>('accounts--id', true);
export const MemKey_AccountType = new MemKey<string>('accounts--type', true);

export const MemKey_DB_Session = new MemKey<DB_Session>('db-session-object', false);
export const MemKey_SessionData = new MemKey<RecursiveObjectOfPrimitives>('jwt-claims', false);
export const MemKey_Jwt = new MemKey<string>('jwt-token', false);

// Legacy: missing/invalid auth throws 403. Kept for the browser auth chain, whose consumers
// (and the FE session-timeout handling) rely on the 403 status. Do not use for new planes.
export const Header_AuthorizationDeprecated403 = new HeaderKey(HeaderKey_Authorization, 403)
	.setProcessor((v: string) => (v ?? '').trim().replace(/^bearer\s+/i, ''));

// Correct semantics: a missing auth header is 401 Unauthorized. Required by machine planes
// (e.g. MCP) whose clients only begin the OAuth flow on a 401 challenge, never on a 403.
export const Header_Authorization = new HeaderKey(HeaderKey_Authorization, 401)
	.setProcessor((v: string) => (v ?? '').trim().replace(/^bearer\s+/i, ''));
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
