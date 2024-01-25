import {DBDef_Workspaces} from '../../shared/db-def';
import {DB_Workspace} from '../../shared/types';
import {ModuleBE_BaseDBV2} from '@nu-art/thunderstorm/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {merge} from '@nu-art/ts-common';
import {SessionKey_Account_BE} from '@nu-art/user-account/backend';


class ModuleBE_Workspace_Class
	extends ModuleBE_BaseDBV2<DB_Workspace> {

	constructor() {
		super(DBDef_Workspaces);
	}

	manipulateQuery(query: FirestoreQuery<DB_Workspace>): FirestoreQuery<DB_Workspace> {
		return {...query, where: merge(query.where, {accountId: SessionKey_Account_BE.get()._id})};
	}

}

export const ModuleBE_Workspace = new ModuleBE_Workspace_Class();