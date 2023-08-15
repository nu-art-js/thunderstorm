import {PreDB} from '@nu-art/ts-common';
import {DB_PermissionDomain} from './types';

export const defaultDomains = [
	{namespace: 'dev', projectId: ''},
	{namespace: 'permissions-def', projectId: ''},
	{namespace: 'permissions-assign', projectId: ''}
] as PreDB<DB_PermissionDomain>[];