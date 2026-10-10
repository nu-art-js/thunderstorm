import {expect} from 'chai';
import {
	canCreateInLocale,
	I18nAdminGroupId,
	i18nLocaleAccess,
	i18nLocaleGroupId,
	I18nServiceAccountGroupId,
	localeIdFromCode,
	type DB_I18nOverlay,
} from '@nu-art/i18n-shared';
import {deriveEntityAccessFields, deriveEntityGroupId, MemKey_UserAccessIds, MemKey_UserScopePermissions} from '@nu-art/permissions-backend';
import type {DB_AccessGroup, UI_AccessGroup} from '@nu-art/permissions-shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {ModuleBE_LocaleDB_Class} from '../main/_entity/locale/ModuleBE_LocaleDB.js';
import {ModuleBE_I18nOverlayDB_Class} from '../main/_entity/overlay/ModuleBE_I18nOverlayDB.js';

type Group = { _id: string; key: string; members: string[]; scopeEntries?: string[] };

/** Same upward walk as ModuleBE_Permissions.walkGroupGraphUp: every group reachable through `members`. */
const reachableIds = (personalGroupId: string, groups: Group[]): string[] => {
	const found = new Set<string>();
	const queue = [personalGroupId];
	while (queue.length) {
		const current = queue.shift()!;
		for (const group of groups)
			if (group.members.includes(current) && !found.has(group._id)) {
				found.add(group._id);
				queue.push(group._id);
			}
	}
	return [personalGroupId, ...found];
};

/** The framework's read/write/delete rule: any caller id in one of the listed access keys. */
const allowed = (access: Record<string, string[]>, callerIds: string[], ...keys: string[]) =>
	keys.some(key => access[key]?.some(id => callerIds.includes(id)));

class FakeGroupsLocaleDB_Class
	extends ModuleBE_LocaleDB_Class {
	groups: DB_AccessGroup[] = [];
	locales: string[] = [];
	writes = 0;

	protected async visibleLocaleCodes() {
		return this.locales;
	}

	protected async queryGroups(ids: string[]) {
		return ids.map(id => this.groups.find(group => group._id === id));
	}

	protected async createGroups(groups: UI_AccessGroup[]) {
		this.writes++;
		this.groups.push(...structuredClone(groups) as DB_AccessGroup[]);
	}

	protected async updateGroup(group: DB_AccessGroup) {
		this.writes++;
		this.groups = this.groups.map(existing => existing._id === group._id ? structuredClone(group) : existing);
	}
}

describe('i18n ACL - four groups per locale', () => {
	it('group ids are the framework entity-group ids of the locale document', () => {
		for (const key of ['readers', 'writers', 'deleters', 'owners'] as const)
			expect(i18nLocaleGroupId('nl_NL', key)).to.equal(deriveEntityGroupId(localeIdFromCode('nl_NL'), key));
	});

	it('ensure creates the four groups with the role chain and the service account as member', async () => {
		const db = new FakeGroupsLocaleDB_Class();
		db.locales = ['nl_NL'];
		expect(await db.ensureLocaleAccess(['de_DE'])).to.deep.equal({created: 8, updated: 0});
		const nl = (key: 'readers' | 'writers' | 'deleters' | 'owners') => db.groups.find(group => group._id === i18nLocaleGroupId('nl_NL', key))!;
		expect(nl('owners').members).to.have.members([I18nAdminGroupId, I18nServiceAccountGroupId]);
		expect(nl('writers').members).to.have.members([i18nLocaleGroupId('nl_NL', 'owners'), I18nServiceAccountGroupId]);
		expect(nl('deleters').members).to.have.members([i18nLocaleGroupId('nl_NL', 'owners'), I18nServiceAccountGroupId]);
		expect(nl('readers').members).to.have.members([i18nLocaleGroupId('nl_NL', 'writers'), i18nLocaleGroupId('nl_NL', 'deleters'), I18nServiceAccountGroupId]);
		expect(nl('writers').key).to.equal('i18n-locale--nl_NL--writers');
		expect(db.groups.every(group => group.type === 'entity')).to.equal(true);
	});

	it('ensure is idempotent: a second run writes nothing', async () => {
		const db = new FakeGroupsLocaleDB_Class();
		db.locales = ['nl_NL', 'de_DE'];
		await db.ensureLocaleAccess();
		const snapshot = structuredClone(db.groups);
		const writes = db.writes;
		expect(await db.ensureLocaleAccess(['nl_NL'])).to.deep.equal({created: 0, updated: 0});
		expect(db.writes).to.equal(writes);
		expect(db.groups).to.deep.equal(snapshot);
	});

	it('ensure repairs missing members by union and keeps added translators', async () => {
		const db = new FakeGroupsLocaleDB_Class();
		db.locales = ['nl_NL'];
		await db.ensureLocaleAccess();
		const writers = db.groups.find(group => group._id === i18nLocaleGroupId('nl_NL', 'writers'))!;
		writers.members = ['translator-anna'];
		expect(await db.ensureLocaleAccess()).to.deep.equal({created: 0, updated: 1});
		expect(db.groups.find(group => group._id === writers._id)!.members)
			.to.have.members(['translator-anna', i18nLocaleGroupId('nl_NL', 'owners'), I18nServiceAccountGroupId]);
	});
});

describe('i18n ACL - documents minted with their locale groups', () => {
	it('locale and override docs carry the four groups, creators = writers', () => {
		const access = i18nLocaleAccess('nl_NL').__access;
		const derived = deriveEntityAccessFields(localeIdFromCode('nl_NL')).__access;
		expect(access.readers).to.deep.equal(derived.readers);
		expect(access.writers).to.deep.equal(derived.writers);
		expect(access.deleters).to.deep.equal(derived.deleters);
		expect(access.owners).to.deep.equal(derived.owners);
		expect(access.creators).to.deep.equal(derived.writers);
	});
});

describe('i18n ACL - access through membership', () => {
	const db = new FakeGroupsLocaleDB_Class();
	const nlDoc = i18nLocaleAccess('nl_NL').__access;
	const deDoc = i18nLocaleAccess('de_DE').__access;
	before(async () => {
		db.locales = ['nl_NL', 'de_DE'];
		await db.ensureLocaleAccess();
		db.groups.find(group => group._id === i18nLocaleGroupId('nl_NL', 'writers'))!.members.push('translator-anna');
	});

	it('the service account reads, writes and deletes every locale through membership only', () => {
		const sa = reachableIds(I18nServiceAccountGroupId, db.groups);
		for (const doc of [nlDoc, deDoc]) {
			expect(allowed(doc, sa, 'readers')).to.equal(true);
			expect(allowed(doc, sa, 'writers', 'owners')).to.equal(true);
			expect(allowed(doc, sa, 'deleters', 'owners')).to.equal(true);
		}
		expect(allowed(i18nLocaleAccess('fr_FR').__access, sa, 'readers')).to.equal(false);
	});

	it('a translator of nl can read and write nl but not write (or create in) de', () => {
		const anna = reachableIds('translator-anna', db.groups);
		expect(allowed(nlDoc, anna, 'readers')).to.equal(true);
		expect(allowed(nlDoc, anna, 'writers', 'owners')).to.equal(true);
		expect(allowed(deDoc, anna, 'writers', 'owners')).to.equal(false);
		expect(allowed(deDoc, anna, 'readers')).to.equal(false);
		expect(canCreateInLocale(anna, 'nl_NL')).to.equal(true);
		expect(canCreateInLocale(anna, 'de_DE')).to.equal(false);
	});

	it('an i18n admin reaches every locale through the owners chain', () => {
		const admin = reachableIds(I18nAdminGroupId, db.groups);
		expect(allowed(deDoc, admin, 'writers', 'owners')).to.equal(true);
		expect(canCreateInLocale(admin, 'de_DE')).to.equal(true);
	});

	it('the overlay module refuses a nl translator creating a de override', async () => {
		class Overlay_Class
			extends ModuleBE_I18nOverlayDB_Class {
			prepare(instance: Partial<DB_I18nOverlay>) {
				return this.preWriteProcessing(instance as DB_I18nOverlay, undefined as unknown as DB_I18nOverlay);
			}
		}

		const overlay = new Overlay_Class();
		const asAnna = (action: () => Promise<unknown>) => new MemStorage().init(async () => {
			MemKey_AccountId.set('anna' as never);
			MemKey_UserScopePermissions.set(['i18n-overlay:create']);
			MemKey_UserAccessIds.set({_self: ['translator-anna'], i18n: reachableIds('translator-anna', db.groups).slice(1)} as never);
			return action();
		});
		await asAnna(() => overlay.prepare({locale: 'nl_NL', key: 'a', forms: {other: 'x'}}));
		let error: unknown;
		await asAnna(() => overlay.prepare({locale: 'de_DE', key: 'a', forms: {other: 'x'}}).catch(e => error = e));
		expect(String((error as Error)?.message)).to.contain('writers group');
	});
});

