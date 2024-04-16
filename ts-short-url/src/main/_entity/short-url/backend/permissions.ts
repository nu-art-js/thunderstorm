import {DomainNamespace_ShortUrl, PermissionKey_ShortUrlEdit, PermissionKey_ShortUrlView} from '../shared/consts';
import {DefaultDef_Group, DefaultDef_Package} from '@nu-art/permissions/shared/types';
import {
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DuplicateDefaultAccessLevels
} from '@nu-art/permissions/shared/consts';
import {defaultValueResolver, PermissionKey_BE} from '@nu-art/permissions/backend/PermissionKey_BE';
import {ModuleBE_ShortUrlDB} from './ModuleBE_ShortUrlDB';

export const Domain_ShortUrl = Object.freeze({
	_id: '8a7614bc128ee1fb6ddf896c46922ab3',
	namespace: DomainNamespace_ShortUrl
});


export const PermissionGroup_ShortUrl_NoAccess: DefaultDef_Group = {
	_id: '3f02039e68ac93458c502252aee89337',
	name: `${DomainNamespace_ShortUrl}/No Access`,
	accessLevels: {
		[DomainNamespace_ShortUrl]: DefaultAccessLevel_NoAccess.name,
	},
};

export const PermissionGroup_ShortUrl_Viewer: DefaultDef_Group = {
	_id: '0bbd1fe0cf62852bb312e68e6c037409',
	name: `${DomainNamespace_ShortUrl}/Viewer`,
	accessLevels: {
		[DomainNamespace_ShortUrl]: DefaultAccessLevel_Read.name,
	},
};
export const PermissionGroup_ShortUrl_Editor: DefaultDef_Group = {
	_id: 'bb6e1762b3aa2dc567c17cfbb4934b23',
	name: `${DomainNamespace_ShortUrl}/Editor`,
	accessLevels: {
		[DomainNamespace_ShortUrl]: DefaultAccessLevel_Delete.name,
	},
};

export const PermissionGroup_ShortUrl_Admin: DefaultDef_Group = {
	_id: '1362b32935959c67863966faf1217087',
	name: `${DomainNamespace_ShortUrl}/Admin`,
	accessLevels: {
		[DomainNamespace_ShortUrl]: DefaultAccessLevel_Admin.name,
	},
};

export const PermissionGroups_ShortUrl: DefaultDef_Group[] = [
	PermissionGroup_ShortUrl_NoAccess,
	PermissionGroup_ShortUrl_Viewer,
	PermissionGroup_ShortUrl_Editor,
	PermissionGroup_ShortUrl_Admin,
];

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