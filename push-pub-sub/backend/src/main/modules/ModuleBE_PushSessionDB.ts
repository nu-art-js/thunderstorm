import type {DB_Prototype} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {BaseDBDefBE} from '@nu-art/db-api-backend';
import {DBDef_PushSession, DBProto_PushSession} from '@nu-art/push-pub-sub-shared/push-session/index';

export class ModuleBE_PushSessionDB_Class
	extends ModuleBE_BaseDB<DBProto_PushSession & DB_Prototype, object> {

	constructor() {
		super(DBDef_PushSession as unknown as BaseDBDefBE);
	}
}

export const ModuleBE_PushSessionDB = new ModuleBE_PushSessionDB_Class();
