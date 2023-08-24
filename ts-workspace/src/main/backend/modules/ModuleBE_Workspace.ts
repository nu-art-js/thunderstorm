import {DBDef_Workspaces} from '../../shared/db-def';
import {DB_Workspace} from '../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/thunderstorm/backend';


class ModuleBE_Workspace_Class
	extends ModuleBE_BaseDBV2<DB_Workspace> {

	constructor() {
		super(DBDef_Workspaces);
	}

}

export const ModuleBE_Workspace = new ModuleBE_Workspace_Class();