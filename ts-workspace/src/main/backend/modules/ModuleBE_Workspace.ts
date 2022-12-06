import {BaseDB_ModuleBE} from '@nu-art/db-api-generator/backend';
import {DBDef_Workspaces} from '../../shared/db-def';
import {DB_Workspace} from '../../shared/types';


class ModuleBE_Workspace_Class
	extends BaseDB_ModuleBE<DB_Workspace> {

	constructor() {
		super(DBDef_Workspaces);
	}

}

export const ModuleBE_Workspace = new ModuleBE_Workspace_Class();