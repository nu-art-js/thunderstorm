import {expect} from 'chai';
import type {DB_I18nOverlay, I18N_Forms} from '@nu-art/i18n-shared';
import {ModuleBE_I18nOverlayDB_Class} from '../main/_entity/overlay/ModuleBE_I18nOverlayDB.js';

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
