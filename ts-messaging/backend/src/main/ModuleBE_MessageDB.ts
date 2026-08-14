/*
 * @nu-art/ts-messaging-backend — Message DB module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {asOptionalArray, BadImplementationException} from '@nu-art/ts-common';
import {ModuleBE_BaseDB, PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {CollectionActionType} from '@nu-art/firebase-backend';
import {DBDef_Message, DatabaseDef_Message, DatabaseDef_Topic, MessageMention_Default} from '@nu-art/ts-messaging-shared';
import {getAuditorId} from '@nu-art/user-account-backend';
import {dispatch_OnMessageMentioned} from './dispatchers.js';
import {ModuleBE_MessagingAccess} from './messaging-access-wiring.js';
import {ModuleBE_TopicDB} from './ModuleBE_TopicDB.js';

export class ModuleBE_MessageDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Message> {

	constructor() {
		super(DBDef_Message);
	}

	init() {
		super.init();
		ModuleBE_MessagingAccess.wireMessage(this);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_Message['uiType'], _originalDbInstance: DatabaseDef_Message['dbType']) {
		if (!dbInstance._auditorId)
			dbInstance._auditorId = await getAuditorId();
	}

	protected async postWriteProcessing(data: PostWriteProcessingDataShape<DatabaseDef_Message['dbType']>, actionType: CollectionActionType) {
		if (actionType !== 'create')
			return;

		const created = asOptionalArray(data.updated) ?? [];
		for (const message of created) {
			const mentionedAccountIds = message.mention ?? MessageMention_Default;
			if (mentionedAccountIds.length === 0)
				continue;

			const topic = await ModuleBE_TopicDB.query.uniqueUnmanipulated(stringToUniqueId<DatabaseDef_Topic['dbKey']>(message.topicId));
			if (!topic)
				throw new BadImplementationException(`Topic not found for mentioned message topicId=${message.topicId}`);

			await dispatch_OnMessageMentioned.dispatchModuleAsync({
				topic,
				message,
				mentionedAccountIds,
			});
		}
	}
}

export const ModuleBE_MessageDB = new ModuleBE_MessageDB_Class();
