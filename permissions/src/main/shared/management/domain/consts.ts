import {PreDB} from '@nu-art/ts-common';
import {DB_PermissionDomain} from './types';

export const defaultDomains = [
	{namespace: 'Dev', projectId: ''},
	{namespace: 'Permissions-Def', projectId: ''},
	{namespace: 'Permissions-Assign', projectId: ''}
] as PreDB<DB_PermissionDomain>[];