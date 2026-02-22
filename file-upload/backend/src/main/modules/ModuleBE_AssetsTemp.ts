import {DBDef_TempAssets, DBProto_AssetsTemp} from '@nu-art/file-upload-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';


export class ModuleBE_AssetsTemp_Class
	extends ModuleBE_BaseDB<DBProto_AssetsTemp> {

	constructor() {
		super(DBDef_TempAssets);
	}
}

export const ModuleBE_AssetsTemp = new ModuleBE_AssetsTemp_Class();
