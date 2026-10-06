import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DBDef_Topic, DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';
import {ModuleBE_MessagingAccess} from './messaging-access-wiring.js';

type TopicAnchor = DatabaseDef_Topic['uiType']['anchor'];

export class ModuleBE_TopicDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Topic> {

	constructor() {
		super(DBDef_Topic);
	}

	init() {
		super.init();
		ModuleBE_MessagingAccess.wireTopic(this);
	}

	/**
	 * One Topic per anchor (`uniqueKeys` = `anchor.dbKey` + `anchor.id`).
	 * A second call with the same pointer returns the existing Topic.
	 */
	async ensureForAnchor(anchor: TopicAnchor): Promise<DatabaseDef_Topic['dbType']> {
		const existing = await this.query.where({
			'anchor.dbKey': anchor.dbKey,
			'anchor.id': anchor.id,
		} as Partial<DatabaseDef_Topic['dbType']>);
		if (existing[0])
			return existing[0];

		return this.create.item({anchor});
	}
}

export const ModuleBE_TopicDB = new ModuleBE_TopicDB_Class();
