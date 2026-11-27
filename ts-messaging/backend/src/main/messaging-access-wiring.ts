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
	MemKey_UserScopePermissions,
	ModuleBE_AccessGroupDB,
	ModuleBE_PermissionScopeDB,
	ModuleBE_Permissions,
	withDocumentAccessBypass,
} from '@nu-art/permissions-backend';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import type {DB_Account} from '@nu-art/user-account-shared';
import {MessagingAdminGroupId, parseMessageMentionIds, topicWriteScopeId, topicWriteScopeToken, type DatabaseDef_Message, type DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';

type AccessCarrier = {
	__access?: DocumentAccessInner;
};

/** Topic rows still mint these groups. Delete and own stay on the owning document. */
const TopicEntityAccessKeys = ['readers', 'writers', 'creators'] as const satisfies readonly (keyof DocumentAccessInner)[];

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
		dbModule.registerPreDeleteInterceptor(dbItems => this.onMessageDelete(dbItems));
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
		const topicAccess = copyAccessFields(topic).__access;
		const authorId = item._auditorId ?? MemKey_AccountId.get();
		const authorGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(authorId);

		// read: everyone on the topic. write: the author only.
		// delete: the author, the topic delete list, and an admin. owner: the topic owner.
		return {
			__access: {
				readers: [...(topicAccess.readers ?? [])],
				writers: [authorGroupId],
				creators: [],
				deleters: filterDuplicates([
					authorGroupId,
					...(topicAccess.deleters ?? []),
					MessagingAdminGroupId,
				]),
				owners: [...(topicAccess.owners ?? [])],
			},
		};
	}

	private async onMessageWrite(dbItem: DatabaseDef_Message['uiType'], original: DatabaseDef_Message['dbType']): Promise<void> {
		const topicId = dbItem.topicId ?? original?.topicId;
		const topic = await this.loadTopicUnmanipulated(topicId);
		const callerIds = resolveCallerAccessIds(MemKey_UserAccessIds.get());

		if (!original) {
			this.assertTopicWriteScope(topic._id);
			return;
		}

		this.assertBucket((original as AccessCarrier).__access, callerIds, 'writers');
	}

	private async onMessageDelete(dbItems: DatabaseDef_Message['dbType'][]): Promise<void> {
		const callerIds = resolveCallerAccessIds(MemKey_UserAccessIds.get());
		for (const item of dbItems)
			this.assertBucket((item as AccessCarrier).__access, callerIds, 'deleters');
	}

	/** Fail closed. An empty bucket grants nobody. Owner does not stand in for this bucket. */
	private assertBucket(
		access: Partial<DocumentAccessInner> | undefined,
		callerIds: UniqueId[],
		bucket: keyof DocumentAccessInner,
	): void {
		if (access?.[bucket]?.some(id => callerIds.includes(id)))
			return;

		this.logWarning(`REJECTED: message ${bucket} denied`);
		throw HttpCodes._4XX.FORBIDDEN('Insufficient document access');
	}

	/** Fail closed. The caller holds `${topicId}:write`, or the post is forbidden. */
	private assertTopicWriteScope(topicId: UniqueId): void {
		const token = topicWriteScopeToken(topicId);
		const scopes = MemKey_UserScopePermissions.peak() ?? [];
		if (scopes.includes(token))
			return;

		this.logWarning(`REJECTED: message write denied topicId=${topicId}`);
		throw HttpCodes._4XX.FORBIDDEN('Insufficient document access');
	}

	/**
	 * Store `${topicId}:write` on one group. A member of that group keeps the scope on this request.
	 * Example: `grantTopicWriteScope(projectTasksWriterId, topicId)` lets a tasks writer post.
	 */
	async grantTopicWriteScope(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): Promise<void> {
		await ModuleBE_Permissions.runAsSystemContext([], () => this.persistTopicWriteScope(groupId, topicId));
		this.addTopicWriteScopeWhenMember(groupId, topicId);
	}

	/**
	 * Drop `${topicId}:write` from this request when the caller is outside `groupId`.
	 * Example: retainTopicWriteScope(projectTasksWriterId, topicId) after the topic groups are deleted.
	 */
	retainTopicWriteScope(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): void {
		const access = MemKey_UserAccessIds.peak();
		const holds = !!access && resolveCallerAccessIds(access).includes(groupId);
		if (!holds)
			this.dropTopicWriteScope(topicId);
	}

	/**
	 * Remove `${topicId}:write` from one writer group and from this request.
	 * Example: revokeTopicWriteScope(projectTasksWriterId, topicId) after the task topic is deleted.
	 */
	async revokeTopicWriteScope(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): Promise<void> {
		await ModuleBE_Permissions.runAsSystemContext([], () => this.removeTopicWriteScope(groupId, topicId));
		this.dropTopicWriteScope(topicId);
	}

	private async persistTopicWriteScope(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): Promise<void> {
		const scopeId = topicWriteScopeId(topicId);
		await withDocumentAccessBypass(async () => {
			const existingScope = await ModuleBE_PermissionScopeDB.query.uniqueUnmanipulated(scopeId);
			if (!existingScope)
				await ModuleBE_PermissionScopeDB.create.item({
					_id: scopeId,
					key: topicId,
					value: 'write',
				});

			const group = await ModuleBE_AccessGroupDB.query.uniqueAssert(groupId);
			if (group.scopeEntries?.includes(scopeId))
				return;

			group.scopeEntries = filterDuplicates([...(group.scopeEntries ?? []), scopeId]);
			await ModuleBE_AccessGroupDB.set.item(group);
		});
	}

	private async removeTopicWriteScope(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): Promise<void> {
		const scopeId = topicWriteScopeId(topicId);
		await withDocumentAccessBypass(async () => {
			const group = await ModuleBE_AccessGroupDB.query.unique(groupId);
			if (group?.scopeEntries?.includes(scopeId)) {
				group.scopeEntries = group.scopeEntries.filter(id => id !== scopeId);
				await ModuleBE_AccessGroupDB.set.item(group);
			}

			const scope = await ModuleBE_PermissionScopeDB.query.uniqueUnmanipulated(scopeId);
			if (scope)
				await ModuleBE_PermissionScopeDB.delete.unique(scopeId);
		});
	}

	/** A member of `groupId` holds `${topicId}:write` for the rest of this request. */
	private addTopicWriteScopeWhenMember(groupId: DatabaseDef_AccessGroup['id'], topicId: UniqueId): void {
		const scopes = MemKey_UserScopePermissions.peak();
		if (!scopes)
			return;

		const access = MemKey_UserAccessIds.peak();
		if (!access || !resolveCallerAccessIds(access).includes(groupId))
			return;

		const token = topicWriteScopeToken(topicId);
		if (scopes.includes(token))
			return;

		MemKey_UserScopePermissions.set([...scopes, token]);
	}

	private dropTopicWriteScope(topicId: UniqueId): void {
		const scopes = MemKey_UserScopePermissions.peak();
		if (!scopes)
			return;

		const token = topicWriteScopeToken(topicId);
		if (!scopes.includes(token))
			return;

		MemKey_UserScopePermissions.set(scopes.filter(entry => entry !== token));
	}

	/**
	 * Backend-owned mention allow-list. Do not "simplify" this.
	 *
	 * Client `mention[]` is ignored. `@_id(<accountId>)` in text is a claim.
	 * A referenced account that is missing, not a topic writer, or the sender is a 400 —
	 * do not drop it and continue. Mention never grants Topic ACL.
	 *
	 * Allow-list = topic writers other than the sender. Valid `@_id` tokens become mention[].
	 * No tokens: 1:1 infers the other writer; multi stays empty.
	 */
	async resolveCreateMentions(
		topicId: UniqueId,
		senderAccountId: UniqueId,
		text?: string,
	): Promise<DB_Account['_id'][]> {
		const writerIds = await this.listTopicWriterAccountIds(topicId);
		const claimed = parseMessageMentionIds(text);
		if (claimed.some(id => id === senderAccountId || !writerIds.has(id)))
			throw HttpCodes._4XX.BAD_REQUEST('Invalid mention');

		if (claimed.length)
			return claimed as DB_Account['_id'][];

		const others = [...writerIds].filter(id => id !== senderAccountId);
		if (others.length === 1)
			return [others[0] as DB_Account['_id']];

		return [];
	}

	async listTopicWriterAccountIds(topicId: UniqueId): Promise<Set<string>> {
		const topic = await this.loadTopicUnmanipulated(topicId);
		const writerGroupIds = ((topic as AccessCarrier).__access?.writers ?? [])
			.map(id => stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(id));
		const accountIds = new Set<string>();
		const pending: DatabaseDef_AccessGroup['id'][] = [...writerGroupIds];
		const seen = new Set<string>();

		while (pending.length > 0) {
			const groupId = pending.pop()!;
			if (seen.has(groupId))
				continue;

			seen.add(groupId);
			const group = await ModuleBE_AccessGroupDB.query.uniqueUnmanipulated(groupId);
			if (!group)
				continue;

			if (group.type === 'user') {
				accountIds.add(group._id);
				continue;
			}

			for (const memberId of group.members)
				pending.push(stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(memberId));
		}

		return accountIds;
	}

	async addAccountToTopic(topicId: UniqueId, accountId: UniqueId): Promise<void> {
		const personalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(accountId);
		await ModuleBE_Permissions.runAsSystemContext([], async () => {
			for (const accessKey of TopicEntityAccessKeys) {
				const groupId = await this.ensureEntityGroup(topicId, accessKey);
				await this.addMemberGroupToAccessGroup(groupId, personalGroupId);
			}
		});
	}

	private async mintTopicGroups(topicId: UniqueId): Promise<void> {
		const creatorPersonalGroupId = stringToUniqueId<DatabaseDef_AccessGroup['dbKey']>(MemKey_AccountId.get());

		// Nested MemStorage as bootstrap — runAsServiceAccount(Bootstrap) is systemOnly
		// and 403s when LoadPermissionsMiddleware has already set UserScopePermissions.
		await ModuleBE_Permissions.runAsSystemContext([], async () => {
			for (const accessKey of TopicEntityAccessKeys) {
				const groupId = await this.ensureEntityGroup(topicId, accessKey);
				await this.addMemberGroupToAccessGroup(groupId, creatorPersonalGroupId);
			}
			await this.ensureEntityGroup(topicId, 'deleters');
			await this.ensureEntityGroup(topicId, 'owners');
		});

		this.mergeTopicGroupsIntoCallerAccessIds(topicId);
		await this.grantTopicWriteScope(deriveEntityGroupId(topicId, 'writers'), topicId);
		await this.grantTopicWriteScope(deriveEntityGroupId(topicId, 'owners'), topicId);
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
