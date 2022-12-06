import {DBDef} from '@nu-art/db-api-generator';
import {tsValidateString} from '@nu-art/ts-common';
import {DB_Workspace} from './types';

const Validator_Workspace = {
	key: tsValidateString(),
	accountId: undefined,
	config: undefined,
};

export const DBDef_Workspaces: DBDef<DB_Workspace, 'key' | 'accountId'> = {
	validator: Validator_Workspace,
	dbName: 'workspaces',
	entityName: 'workspace',
	versions: ['1.0.0'],
	uniqueKeys: ['key', 'accountId'],
};