import {expect} from 'chai';
import {I18nAdminGroupId, i18nTranslatorGroupId, type DB_I18nOverlay, type I18N_Forms} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB_Class} from '../main/_entity/overlay/ModuleBE_I18nOverlayDB.js';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_UserAccessIds, MemKey_UserScopePermissions} from '@nu-art/permissions-backend';
import {MemKey_AccountId} from '@nu-art/user-account-backend';

class TestOverlayDB_Class
	extends ModuleBE_I18nOverlayDB_Class {
	rows: Record<string, Record<string, I18N_Forms>> = {nl: {'booking.title': {other: 'Plan'}}};
	queries: string[] = [];

	constructor(ttl = 60_000) {
		super();
		this.setDefaultConfig({overridesCacheTtlMs: ttl});
	}

	protected async loadLocaleOverrides(locale: string) {
		this.queries.push(locale);
		return {...this.rows[locale]};
	}

	written(rows: Partial<DB_I18nOverlay>[]) {
		return this.postWriteProcessing({updated: rows as DB_I18nOverlay[]}, 'update' as never);
	}

	deleted(row: Partial<DB_I18nOverlay>) {
		return this.postWriteProcessing({deleted: row as DB_I18nOverlay}, 'delete' as never);
	}
}

describe('ModuleBE_I18nOverlayDB - per-locale overrides cache', () => {
	it('one query per locale, then served from cache', async () => {
		const db = new TestOverlayDB_Class();
		expect(await db.getLocaleOverrides('nl')).to.deep.equal({'booking.title': {other: 'Plan'}});
		await db.getLocaleOverrides('nl');
		await db.getLocaleOverrides('de');
		expect(db.queries).to.deep.equal(['nl', 'de']);
	});

	it('a write busts only the written locale', async () => {
		const db = new TestOverlayDB_Class();
		await db.getLocaleOverrides('nl');
		await db.getLocaleOverrides('de');
		db.rows.nl = {'booking.title': {other: 'Boek'}};
		await db.written([{locale: 'nl', key: 'booking.title'}]);
		expect(await db.getLocaleOverrides('nl')).to.deep.equal({'booking.title': {other: 'Boek'}});
		await db.getLocaleOverrides('de');
		expect(db.queries).to.deep.equal(['nl', 'de', 'nl']);
	});

	it('a delete busts the locale, so the default shows again', async () => {
		const db = new TestOverlayDB_Class();
		await db.getLocaleOverrides('nl');
		db.rows.nl = {};
		await db.deleted({locale: 'nl', key: 'booking.title'});
		expect(await db.getLocaleOverrides('nl')).to.deep.equal({});
	});

	it('re-reads after the TTL (writes made on other instances)', async () => {
		const db = new TestOverlayDB_Class(0);
		await db.getLocaleOverrides('nl');
		await db.getLocaleOverrides('nl');
		expect(db.queries).to.deep.equal(['nl', 'nl']);
	});
});

class AuditOverlayDB_Class
	extends ModuleBE_I18nOverlayDB_Class {
	prepare(instance: Partial<DB_I18nOverlay>) {
		return this.preWriteProcessing(instance as DB_I18nOverlay, undefined as unknown as DB_I18nOverlay);
	}
}

describe('ModuleBE_I18nOverlayDB - scope check and audit', () => {
	const db = new AuditOverlayDB_Class();
	const row = () => ({locale: 'nl', key: 'booking.title', forms: {other: 'Boek'}});

	it('stamps the editing account and time', async () => {
		const instance: Partial<DB_I18nOverlay> = row();
		await new MemStorage().init(async () => {
			MemKey_AccountId.set('acc-1' as never);
			MemKey_UserScopePermissions.set(['i18n-overlay:create']);
			await db.prepare(instance);
		});
		expect(instance._editedBy).to.equal('acc-1');
		expect(instance._editedAt).to.be.a('number');
	});

	it('rejects a caller without the i18n-overlay scope', async () => {
		let error: unknown;
		await new MemStorage().init(async () => {
			MemKey_AccountId.set('acc-2' as never);
			MemKey_UserScopePermissions.set(['i18n-ui:view']);
			await db.prepare(row()).catch(e => error = e);
		});
		expect(String((error as Error)?.message)).to.contain('i18n-overlay');
	});

	it('system writes (no permission context) are stamped as system', async () => {
		const instance: Partial<DB_I18nOverlay> = row();
		await db.prepare(instance);
		expect(instance._editedBy).to.equal('system');
	});
});

describe('ModuleBE_I18nOverlayDB - per-locale ACL on creation', () => {
	const db = new AuditOverlayDB_Class();
	const asCaller = (groups: string[], action: () => Promise<unknown>) => new MemStorage().init(async () => {
		MemKey_AccountId.set('acc-3' as never);
		MemKey_UserScopePermissions.set(['i18n-overlay:create']);
		MemKey_UserAccessIds.set({_self: ['personal'], i18n: groups} as never);
		return action();
	});

	it("the locale's translator may create its override", async () => {
		await asCaller([i18nTranslatorGroupId('nl')], () => db.prepare({locale: 'nl', key: 'a', forms: {other: 'x'}}));
	});

	it("another locale's translator may not", async () => {
		let error: unknown;
		await asCaller([i18nTranslatorGroupId('de')], () => db.prepare({locale: 'nl', key: 'a', forms: {other: 'x'}}).catch(e => error = e));
		expect(String((error as Error)?.message)).to.contain('translator');
	});

	it('the i18n admins may create in any locale', async () => {
		await asCaller([I18nAdminGroupId], () => db.prepare({locale: 'de', key: 'a', forms: {other: 'x'}}));
	});

	it('results seen by a caller outside the Default group are not cached for others', async () => {
		const cacheDb = new TestOverlayDB_Class();
		await asCaller([i18nTranslatorGroupId('nl')], () => cacheDb.getLocaleOverrides('nl'));
		await cacheDb.getLocaleOverrides('nl');
		expect(cacheDb.queries).to.deep.equal(['nl', 'nl']);
	});
});
