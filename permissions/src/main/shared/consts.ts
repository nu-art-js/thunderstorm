import {md5, UniqueId} from '@nu-art/ts-common';
import {DefaultDef_AccessLevel, DefaultDef_Domain, DefaultDef_Group, DefaultDef_Package} from './types';


export const Prefix_PermissionKey = 'permission-key--';
export const DomainNamespace_PermissionAssignment = 'Permissions Assignment';
export const DomainNamespace_PermissionManagement = 'Permissions Management';
export const DefaultAccessLevel_NoAccess = Object.freeze({name: 'No-Access', value: 0});
export const DefaultAccessLevel_Read = Object.freeze({name: 'Read', value: 200});
export const DefaultAccessLevel_Write = Object.freeze({name: 'Write', value: 400});
export const DefaultAccessLevel_Delete = Object.freeze({name: 'Delete', value: 600});
export const DefaultAccessLevel_Admin = Object.freeze({name: 'Admin', value: 1000});

export const defaultAccessLevels = [
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_Admin,
];

export const DuplicateDefaultAccessLevels = (seed: string): DefaultDef_AccessLevel[] => {
	return CreateDefaultAccessLevels(seed, [
		{...DefaultAccessLevel_NoAccess},
		{...DefaultAccessLevel_Read},
		{...DefaultAccessLevel_Write},
		{...DefaultAccessLevel_Delete},
		{...DefaultAccessLevel_Admin},
	]);
};

export const CreateDefaultAccessLevels = (seed: string, accessLevels: { name: string, value: number }[]): DefaultDef_AccessLevel[] => {
	return accessLevels.map(level => ({...level, _id: md5(`${seed}${level.name}`)}));
};

export const defaultLevelsRouteLookupWords: { [k: string]: string } = {
	'query': 'Read',
	'query-unique': 'Read',
	'sync': 'Read',
	'patch': 'Write',
	'upsert': 'Write',
	'upsert-all': 'Write',
	'delete': 'Delete',
	'delete-all': 'Delete',
	'delete-unique': 'Delete'
};
