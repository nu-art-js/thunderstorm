import type {DB_Prototype} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {BaseDBDefBE} from '@nu-art/db-api-backend';
import {DatabaseDef_PushSession} from '@nu-art/push-pub-sub-shared/push-session/types';
import {DBDef_PushSession} from '@nu-art/push-pub-sub-shared/push-session/db-def';

export class ModuleBE_PushSessionDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PushSession & DB_Prototype, object> {

	constructor() {
		super(DBDef_PushSession as unknown as BaseDBDefBE);
	}
}

export const ModuleBE_PushSessionDB = new ModuleBE_PushSessionDB_Class();
