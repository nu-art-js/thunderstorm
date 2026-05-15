import {TypedKeyValue} from '@nu-art/ts-common';

export type SessionData_HasPassword = { hasPassword: boolean };
export type _SessionKey_PasswordAuth = TypedKeyValue<'passwordAuth', SessionData_HasPassword>;
