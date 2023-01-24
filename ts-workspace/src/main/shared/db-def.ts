import {DBDef} from '@nu-art/db-api-generator';
import {OmitDBObject, tsValidateMustExist, tsValidateString, ValidatorTypeResolver} from '@nu-art/ts-common';
import {DB_Workspace} from './types';

const Validator_Workspace: ValidatorTypeResolver<OmitDBObject<DB_Workspace>> = {
	key: tsValidateString(),
	accountId: tsValidateString(),
	config: tsValidateMustExist,
};

export const DBDef_Workspaces: DBDef<DB_Workspace, 'key' | 'accountId'> = {
	validator: Validator_Workspace,
	dbName: 'workspaces',
	entityName: 'workspace',
	versions: ['1.0.0'],
	uniqueKeys: ['key', 'accountId'],
};