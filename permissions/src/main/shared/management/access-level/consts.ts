import {DB_PermissionAccessLevel} from './types';
import {PartialProperties, PreDB} from '@nu-art/ts-common';


export const DefaultAccessLevel_NoAccess = 'No-Access';
export const DefaultAccessLevel_Read = 'Read';
export const DefaultAccessLevel_Write = 'Write';
export const DefaultAccessLevel_Delete = 'Delete';
export const DefaultAccessLevel_Admin = 'Admin';

export const defaultAccessLevels: Readonly<PartialProperties<PreDB<DB_PermissionAccessLevel>, '_auditorId' | 'domainId'>[]> = Object.freeze([
	{name: DefaultAccessLevel_NoAccess, value: 0},
	{name: DefaultAccessLevel_Read, value: 200},
	{name: DefaultAccessLevel_Write, value: 400},
	{name: DefaultAccessLevel_Delete, value: 600},
	{name: DefaultAccessLevel_Admin, value: 1000},
]);

export const defaultLevelsRouteLookupWords: { [k: string]: string[] } = {
	'Read': ['metadata', 'query', 'query-unique', 'sync'],
	'Write': ['upsert', 'upsert-all'],
	'Delete': ['delete', 'delete-all', 'delete-unique'],
	'Upgrade': ['upgrade-collection'],
};