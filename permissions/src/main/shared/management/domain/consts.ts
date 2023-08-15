import {PreDB} from '@nu-art/ts-common';
import {DB_PermissionDomain} from './types';

export const permissionsDefName = 'permissions-def';
export const permissionsAssignName = 'permissions-assign';
export const defaultDomains = [
	{namespace: 'dev', projectId: ''},
	{namespace: permissionsDefName, projectId: ''},
	{namespace: permissionsAssignName, projectId: ''}
] as PreDB<DB_PermissionDomain>[];