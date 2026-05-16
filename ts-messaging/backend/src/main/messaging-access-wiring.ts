import {ModuleBE_Permissions} from '@nu-art/permissions-backend';
import type {DocumentAccessFields} from '@nu-art/permissions-shared';
import {
	MessagingReadGroupId,
	MessagingWriteGroupId,
	MessagingDeleteGroupId,
} from '@nu-art/ts-messaging-shared';
import {ModuleBE_TopicDB} from './ModuleBE_TopicDB.js';
import {ModuleBE_MessageDB} from './ModuleBE_MessageDB.js';

const MessagingScope = 'messaging';

const messagingAccessFields: DocumentAccessFields = {
	__access: {
		readers: [MessagingReadGroupId],
		writers: [MessagingWriteGroupId],
		deleters: [MessagingDeleteGroupId],
		owners: [],
	}
};

export function wireMessagingDocumentAccess() {
	ModuleBE_Permissions.setAccessContextResolver(
		ModuleBE_TopicDB,
		() => messagingAccessFields,
		[MessagingScope]
	);

	ModuleBE_Permissions.setAccessContextResolver(
		ModuleBE_MessageDB,
		() => messagingAccessFields,
		[MessagingScope]
	);
}
