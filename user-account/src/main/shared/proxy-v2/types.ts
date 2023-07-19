import {DB_Object, TypedKeyValue} from '@nu-art/ts-common';

export type ServiceAccountApi = TypedKeyValue<string, string>;

export type ProxyServiceAccount = DB_Object & {
	label: string,
	email: string,
	extra: TypedKeyValue<string, string>[];
}

//json token- name, email, creationTimestamp, expirationTimestamp, creator(who created this token), additionalClaims(the service account extras)