import {filterDuplicates, type UniqueId} from '@nu-art/ts-common';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup, PermissionScope} from '@nu-art/permissions-shared';
import {PermissionScope_Developer, PermissionScope_ServiceAccount, permissionScopeId} from '@nu-art/permissions-shared';

type GroupId = DatabaseDef_AccessGroup['dbKey'];

export type DeveloperAdminGroupDef = {
	readonly key: string;
	readonly scopes: readonly {scope: PermissionScope; value: string}[];
};

export function developerRunActionsScopeId() {
	return permissionScopeId(PermissionScope_Developer.key, 'run-actions');
}

export function permissionsAdminScopeEntries() {
	return [
		permissionScopeId('permissions-ui', 'view'),
		permissionScopeId('access-group', 'create'),
		permissionScopeId(PermissionScope_ServiceAccount.key, 'run'),
		developerRunActionsScopeId(),
	];
}

/** Permissions Admin must already exist and must not already hold run-actions. */
export function shouldStampDeveloperAdminGroups(
	admin: {scopeEntries?: readonly UniqueId[]} | undefined,
	runId: UniqueId,
): boolean {
	if (!admin)
		return false;

	return !admin.scopeEntries?.includes(runId);
}

/**
 * Ids come from the definition key (`group/<key>`), not the stored key.
 * A messaging admin group stores key `messaging` and is still included.
 */
export function developerAdminGroupIds(definitions: readonly {key: string}[]): UniqueId[] {
	return filterDuplicates([
		hashToUniqueId<GroupId>('group/permissions-admin'),
		hashToUniqueId<GroupId>('group/org-apex-admin'),
		...definitions
			.filter(def => def.key.endsWith('-admin'))
			.map(def => hashToUniqueId<GroupId>(`group/${def.key}`)),
	]);
}

export function scopeEntriesForDefinedGroup(def: DeveloperAdminGroupDef) {
	const scopeEntries = def.scopes.map(({scope, value}) => permissionScopeId(scope.key, value));
	if (def.key.endsWith('-admin'))
		scopeEntries.push(developerRunActionsScopeId());

	return filterDuplicates(scopeEntries);
}

export function groupsMissingDeveloperRunActions<T extends { _id: UniqueId; scopeEntries?: readonly UniqueId[] }>(
	groups: readonly T[],
	adminGroupIds: ReadonlySet<UniqueId>,
	runId: UniqueId,
): T[] {
	return groups.filter(group => adminGroupIds.has(group._id) && !group.scopeEntries?.includes(runId));
}
