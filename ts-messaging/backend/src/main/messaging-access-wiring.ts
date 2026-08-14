/*
 * @nu-art/ts-messaging-backend — per-topic document ACL
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException, filterDuplicates, Module, UniqueId} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {
	AccessScope_Self,
	AllDocumentAccessKeys,
	type DatabaseDef_AccessGroup,
	type DocumentAccessFields,
	type DocumentAccessInner,
	type ScopedAccessIds,
} from '@nu-art/permissions-shared';
import {
	copyAccessFields,
	deriveEntityAccessFields,
	deriveEntityGroupId,
	MemKey_UserAccessIds,
	ModuleBE_AccessGroupDB,
	ModuleBE_Permissions,
} from '@nu-art/permissions-backend';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import type {DatabaseDef_Message, DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';

type AccessCarrier = {
	__access?: DocumentAccessInner;
};

function resolveCallerAccessIds(scopedDict: ScopedAccessIds): UniqueId[] {
	const selfIds = scopedDict[AccessScope_Self] ?? [];
	return filterDuplicates([...selfIds, ...Object.values(scopedDict).flat()]);
}


export class ModuleBE_MessagingAccess_Class
	extends Module {

	private topicDB?: ModuleBE_BaseDB<DatabaseDef_Topic>;

	public wireTopic(dbModule: ModuleBE_BaseDB<DatabaseDef_Topic>): void {
		this.topicDB = dbModule;
		ModuleBE_Permissions.setAccessContextResolver(dbModule, item => this.resolveTopicAccess(item));
	}

	public wireMessage(dbModule: ModuleBE_BaseDB<DatabaseDef_Message>): void {
		ModuleBE_Permissions.setAccessContextResolver(dbModule, item => this.resolveMessageAccess(item));
		dbModule.registerPreWriteInterceptor((dbItem, original) => this.onMessageWrite(dbItem, original));
	}

	private async resolveTopicAccess(item: DatabaseDef_Topic['uiType']): Promise<DocumentAccessFields> {
		const topicId = item._id;
		if (!topicId)
			throw new BadImplementationException('Topic _id is required before access groups can be minted');

		await this.mintTopicGroups(topicId);
		return deriveEntityAccessFields(topicId);
	}

	private async resolveMessageAccess(item: DatabaseDef_Message['uiType']): Promise<DocumentAccessFields> {
		const topic = await this.loadTopicUnmanipulated(item.topicId);
		return copyAccessFields(topic);
	}

	private async onMessageWrite(dbItem: DatabaseDef_Message['uiType'], original: DatabaseDef_Message['dbType']): Promise<void> {
		const topicId = dbItem.topicId ?? original?.topicId;
		const topic = await this.loadTopicUnmanipulated(topicId);
		const access = (topic as AccessCarrier).__access;
		const callerIds = resolveCallerAccessIds(MemKey_UserAccessIds.get());

		if (!original) {
			this.assertCallerInBuckets(access, callerIds, topic._id, 'writers', 'owners');
			return;
		}

		this.assertAuthorOrTopicOwner(original, access, callerIds, topic._id);
	}

	private assertAuthorOrTopicOwner(
		original: DatabaseDef_Message['dbType'],
		access: DocumentAccessInner | undefined,
		callerIds: UniqueId[],
		topicId: UniqueId,
	): void {
		const accountId = MemKey_AccountId.get();
		if (original._auditorId === accountId)
			return;

		this.assertCallerInBuckets(access, callerIds, topicId, 'owners');
	}

	private assertCallerInBuckets(
		access: Partial<DocumentAccessInner> | undefined,
		callerIds: UniqueId[],
		topicId: UniqueId,
		...keys: (keyof DocumentAccessInner)[]
	): void {
		if (!keys.some(key => access?.[key]?.length))
			return;

		if (keys.some(key => access?.[key]?.some(id => callerIds.includes(id))))
			return;

		this.logWarning(`REJECTED: insufficient document access — topicId=${topicId} keys=${keys.join('|')}`);
		throw HttpCodes._4XX.FORBIDDEN('Insufficient document access');
	}

	private async mintTopicGroups(topicId: UniqueId): Promise<void> {
		const creatorPersonalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(MemKey_AccountId.get());

		// Nested MemStorage as bootstrap — runAsServiceAccount(Bootstrap) is systemOnly
		// and 403s when LoadPermissionsMiddleware has already set UserScopePermissions.
		await ModuleBE_Permissions.runAsSystemContext([], async () => {
			for (const accessKey of AllDocumentAccessKeys) {
				const groupId = await this.ensureEntityGroup(topicId, accessKey);
				await this.addMemberGroupToAccessGroup(groupId, creatorPersonalGroupId);
			}
		});

		this.mergeTopicGroupsIntoCallerAccessIds(topicId);
	}

	private async ensureEntityGroup(
		topicId: UniqueId,
		accessKey: keyof DocumentAccessInner,
	): Promise<DatabaseDef_AccessGroup['id']> {
		const groupId = deriveEntityGroupId(topicId, accessKey);
		const existing = await ModuleBE_AccessGroupDB.query.unique(groupId);
		if (existing)
			return groupId;

		await ModuleBE_AccessGroupDB.create.item({
			_id: groupId,
			type: 'entity',
			key: `${topicId}:${accessKey}`,
			label: `Topic ${accessKey}`,
			members: [],
			scopeEntries: [],
		});
		this.logDebug(`ensureEntityGroup: created ${groupId} topicId=${topicId} accessKey=${accessKey}`);
		return groupId;
	}

	private async addMemberGroupToAccessGroup(
		groupId: DatabaseDef_AccessGroup['id'],
		memberGroupId: DatabaseDef_AccessGroup['id'],
	): Promise<void> {
		const group = await ModuleBE_AccessGroupDB.query.uniqueAssert(groupId);
		if (group.members.includes(memberGroupId))
			return;

		group.members.push(memberGroupId);
		await ModuleBE_AccessGroupDB.set.item(group);
	}

	private mergeTopicGroupsIntoCallerAccessIds(topicId: UniqueId): void {
		const current = MemKey_UserAccessIds.peak();
		if (!current)
			return;

		const merged: ScopedAccessIds = {...current};
		for (const accessKey of AllDocumentAccessKeys) {
			const groupId = deriveEntityGroupId(topicId, accessKey);
			const groupKey = `${topicId}:${accessKey}`;
			merged[groupKey] = filterDuplicates([...(merged[groupKey] ?? []), groupId]);
		}
		MemKey_UserAccessIds.set(merged);
	}

	private async loadTopicUnmanipulated(topicId: UniqueId): Promise<DatabaseDef_Topic['dbType']> {
		if (!this.topicDB)
			throw new BadImplementationException('Topic DB is not wired — call wireTopic from ModuleBE_TopicDB.init');

		const topic = await this.topicDB.query.uniqueUnmanipulated(stringToUniqueId<DatabaseDef_Topic['dbKey']>(topicId));
		if (!topic)
			throw HttpCodes._4XX.NOT_FOUND(`Topic not found: ${topicId}`);

		return topic;
	}
}

export const ModuleBE_MessagingAccess = new ModuleBE_MessagingAccess_Class();
