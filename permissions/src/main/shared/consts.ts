import {md5} from '@nu-art/ts-common';
import {DefaultDef_AccessLevel} from './types';


export const Prefix_PermissionKey = "permission-key--"

export const DefaultAccessLevel_NoAccess = Object.freeze({name: 'No-Access', value: 0});
export const DefaultAccessLevel_Read = Object.freeze({name: 'Read', value: 200});
export const DefaultAccessLevel_Write = Object.freeze({name: 'Write', value: 400});
export const DefaultAccessLevel_Delete = Object.freeze({name: 'Delete', value: 600});
export const DefaultAccessLevel_Admin = Object.freeze({name: 'Admin', value: 1000});

export const defaultAccessLevels=[
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_Admin,
]

export const DuplicateDefaultAccessLevels = (seed: string): DefaultDef_AccessLevel[] => {
	return [
		{...DefaultAccessLevel_NoAccess},
		{...DefaultAccessLevel_Read},
		{...DefaultAccessLevel_Write},
		{...DefaultAccessLevel_Delete},
		{...DefaultAccessLevel_Admin},
	].map(level => ({...level, _id: md5(	`${seed}${level.name}`)}));
};

export const defaultLevelsRouteLookupWords: { [k: string]: string[] } = {
	'Read': ['metadata', 'query', 'query-unique', 'sync'],
	'Write': ['upsert', 'upsert-all'],
	'Delete': ['delete', 'delete-all', 'delete-unique'],
	'Upgrade': ['upgrade-collection'],
};