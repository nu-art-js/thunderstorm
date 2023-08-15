import {DB_PermissionAccessLevel} from './types';
import {PartialProperties, PreDB} from '@nu-art/ts-common';

export const defaultAccessLevels: PartialProperties<PreDB<DB_PermissionAccessLevel>, '_auditorId' | 'domainId'>[] = [
	{name: 'No Access', value: 0},
	{name: 'Read', value: 200},
	{name: 'Write', value: 400},
	{name: 'Delete', value: 600},
	{name: 'Upgrade', value: 800},
	{name: 'Admin', value: 1000},
];