import {hashToUniqueId} from '@nu-art/db-api-shared';
import {defineAccessGroup, permissionScopeId, type DatabaseDef_AccessGroup} from '@nu-art/permissions-shared';
import {PermissionScope_I18nEdit, PermissionScope_I18nLocale, PermissionScope_I18nOverlay, PermissionScope_I18nUI} from './permission-scope.js';
import {localeIdFromCode} from './_entity/locale/locale-code.js';

export const I18nScopeKey = 'i18n';

/** Edits every locale and manages locales. Member of every locale's owners group. */
export const AccessGroup_I18nAdmin = defineAccessGroup({
	key: 'i18n-admin',
	label: 'i18n Admin',
	scopeKey: I18nScopeKey,
	scopes: [
		{scope: PermissionScope_I18nUI, value: 'view'},
		{scope: PermissionScope_I18nLocale, value: 'create'},
		{scope: PermissionScope_I18nOverlay, value: 'create'},
		{scope: PermissionScope_I18nEdit, value: 'edit'},
	],
});

export const I18nAdminGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`group/${AccessGroup_I18nAdmin.key}`);

/**
 * The i18n system service account. The app must declare it in ModuleBE_Permissions.serviceAccounts
 * (a module cannot contribute one): it reads and ensures through membership of every locale's groups.
 */
export const ServiceAccountId_I18n = 'i18n-system';
export const ServiceAccountConfig_I18n = {
	scopes: ['i18n-ui:view', 'i18n-overlay:create', 'i18n-locale:create'],
	enabled: true,
	systemOnly: false,
	accessIdCache: {ttlMs: 60_000},
} as const;
/** Personal group id the permissions module gives a service account: hashToUniqueId(saId). */
export const I18nServiceAccountGroupId = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(ServiceAccountId_I18n);

/** The four ACL buckets every locale has. creators is stamped with the writers group. */
export type I18nLocaleAccessKey = 'readers' | 'writers' | 'deleters' | 'owners';
export const I18nLocaleAccessKeys: I18nLocaleAccessKey[] = ['owners', 'writers', 'deleters', 'readers'];

/** Same derivation as permissions-backend deriveEntityGroupId: hash('<entityId>:<accessKey>'), entity = the locale _id. */
export const i18nLocaleGroupId = (code: string, key: I18nLocaleAccessKey) =>
	hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`${localeIdFromCode(code)}:${key}`);
export const i18nLocaleGroupKey = (code: string, key: I18nLocaleAccessKey) => `i18n-locale--${code}--${key}`;

/** __access stamped on a locale document and on every override of that locale. */
export const i18nLocaleAccess = (code: string) => {
	const writers = [i18nLocaleGroupId(code, 'writers')];
	return {
		__access: {
			readers: [i18nLocaleGroupId(code, 'readers')],
			writers,
			creators: writers,
			deleters: [i18nLocaleGroupId(code, 'deleters')],
			owners: [i18nLocaleGroupId(code, 'owners')],
		}
	};
};

const LocaleGroupScopes: Record<I18nLocaleAccessKey, string[]> = {
	owners: [],
	writers: [permissionScopeId(PermissionScope_I18nOverlay.key, 'create'), permissionScopeId(PermissionScope_I18nEdit.key, 'edit')],
	deleters: [],
	readers: [permissionScopeId(PermissionScope_I18nUI.key, 'view')],
};

/** Members are the groups below a group in the role chain: owners -> writers, deleters -> readers. */
const localeGroupMembers = (code: string, key: I18nLocaleAccessKey): string[] => {
	const id = (k: I18nLocaleAccessKey) => i18nLocaleGroupId(code, k);
	switch (key) {
		case 'owners':
			return [I18nAdminGroupId, I18nServiceAccountGroupId];
		case 'writers':
		case 'deleters':
			return [id('owners'), I18nServiceAccountGroupId];
		case 'readers':
			return [id('writers'), id('deleters'), I18nServiceAccountGroupId];
	}
};

export type I18nLocaleGroupDef = {
	_id: string;
	type: 'entity';
	key: string;
	label: string;
	members: string[];
	scopeEntries: string[];
};

/** The required shape of a locale's four groups (members and scopes are minimums; extra members are kept). */
export const i18nLocaleGroups = (code: string): I18nLocaleGroupDef[] => I18nLocaleAccessKeys.map(key => ({
	_id: i18nLocaleGroupId(code, key),
	type: 'entity',
	key: i18nLocaleGroupKey(code, key),
	label: `i18n ${code} ${key}`,
	members: localeGroupMembers(code, key),
	scopeEntries: LocaleGroupScopes[key],
}));

type ExistingGroup = { _id: string; members: string[]; scopeEntries?: string[] };

/**
 * Idempotent ensure plan: create missing groups; for existing ones, union in missing required
 * members/scopes (never removes). Empty plan = nothing to do.
 */
export const planLocaleAccess = <G extends ExistingGroup>(codes: string[], existing: G[]) => {
	const byId = new Map(existing.map(group => [group._id, group]));
	const create: I18nLocaleGroupDef[] = [];
	const update: G[] = [];
	for (const required of codes.flatMap(i18nLocaleGroups)) {
		const current = byId.get(required._id);
		if (!current) {
			create.push(required);
			continue;
		}

		const members = required.members.filter(id => !current.members.includes(id));
		const scopes = required.scopeEntries.filter(id => !(current.scopeEntries ?? []).includes(id));
		if (members.length || scopes.length)
			update.push({...current, members: [...current.members, ...members], scopeEntries: [...(current.scopeEntries ?? []), ...scopes]});
	}
	return {create, update};
};

/** Whether caller access ids may create in a locale (the writers bucket, reached directly or through the chain). */
export const canCreateInLocale = (callerIds: string[], code: string) => callerIds.includes(i18nLocaleGroupId(code, 'writers'));
