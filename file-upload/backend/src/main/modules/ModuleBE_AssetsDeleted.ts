import {DBDef_TempDeleted, DatabaseDef_AssetsDeleted} from '@nu-art/file-upload-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';


export class ModuleBE_AssetsDeleted_Class
	extends ModuleBE_BaseDB<DatabaseDef_AssetsDeleted> {

	constructor() {
		super(DBDef_TempDeleted);
	}
}

export const ModuleBE_AssetsDeleted = new ModuleBE_AssetsDeleted_Class();
