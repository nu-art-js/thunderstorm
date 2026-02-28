import {DatabaseDef_PermissionDomain, DefaultAccessLevel_Read, DefaultAccessLevel_Write, DuplicateDefaultAccessLevels} from '@nu-art/permissions-shared';
import {defaultValueResolver, PermissionKey_BE} from '@nu-art/permissions-backend/PermissionKey_BE';
import {ModuleBE_ShortUrlDB} from './ModuleBE_ShortUrlDB.js';
import {DomainNamespace_ShortUrl, PermissionKey_ShortUrlEdit, PermissionKey_ShortUrlView} from '@nu-art/ts-short-url-shared';
import {DefaultDef_Package} from '@nu-art/permissions-backend';
import {asBrandedId} from '@nu-art/db-api-shared';

export const Domain_ShortUrl = Object.freeze({
	_id: asBrandedId<DatabaseDef_PermissionDomain['dbKey']>('8a7614bc128ee1fb6ddf896c46922ab3'),
	namespace: DomainNamespace_ShortUrl
});

export const PermissionKeyBE_ShortUrlView = new PermissionKey_BE(PermissionKey_ShortUrlView, () => defaultValueResolver(DomainNamespace_ShortUrl, DefaultAccessLevel_Read.value));
export const PermissionKeyBE_ShortUrlEdit = new PermissionKey_BE(PermissionKey_ShortUrlEdit, () => defaultValueResolver(DomainNamespace_ShortUrl, DefaultAccessLevel_Write.value));

export const Permissions_ShortUrl: DefaultDef_Package = {
	name: Domain_ShortUrl.namespace,
	domains: [
		{
			...Domain_ShortUrl,
			levels: [...DuplicateDefaultAccessLevels(Domain_ShortUrl._id)],
			dbNames: [
				ModuleBE_ShortUrlDB.dbDef
			].map(dbDef => dbDef.dbKey)
		}
	]
};