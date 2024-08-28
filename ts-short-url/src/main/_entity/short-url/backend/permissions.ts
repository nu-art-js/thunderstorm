import {DomainNamespace_ShortUrl, PermissionKey_ShortUrlEdit, PermissionKey_ShortUrlView} from '../shared/consts';
import {DefaultDef_Package} from '@thunder-storm/permissions/shared/types';
import {DefaultAccessLevel_Read, DefaultAccessLevel_Write, DuplicateDefaultAccessLevels} from '@thunder-storm/permissions/shared/consts';
import {defaultValueResolver, PermissionKey_BE} from '@thunder-storm/permissions/backend/PermissionKey_BE';
import {ModuleBE_ShortUrlDB} from './ModuleBE_ShortUrlDB';

export const Domain_ShortUrl = Object.freeze({
	_id: '8a7614bc128ee1fb6ddf896c46922ab3',
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