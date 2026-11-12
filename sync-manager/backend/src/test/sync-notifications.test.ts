/*
 * @nu-art/sync-manager-backend — Sync notification pause
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {
	syncNotificationsSuppressed,
	syncWriteEffect,
	withSyncNotificationsSuppressed,
} from '../main/sync-notifications.js';

describe('sync notifications', () => {
	it('leaves the sync clock on when the pause is unset', async () => {
		await new MemStorage().init(async () => {
			expect(syncNotificationsSuppressed()).to.equal(false);
			expect(syncWriteEffect({
				suppressed: false,
				hasUpdated: true,
				hasDeleted: false,
				wiped: false,
			})).to.deep.equal({
				stampUpdated: true,
				recordDeleted: false,
				stampDeleted: false,
				stampWiped: false,
			});
		});
	});

	it('holds the sync clock during the pause and restores it after', async () => {
		await new MemStorage().init(async () => {
			let seen = false;
			await withSyncNotificationsSuppressed(async () => {
				seen = syncNotificationsSuppressed();
			});

			expect(seen).to.equal(true);
			expect(syncNotificationsSuppressed()).to.equal(false);
		});
	});

	it('keeps an outer pause when an inner pause ends', async () => {
		await new MemStorage().init(async () => {
			await withSyncNotificationsSuppressed(async () => {
				await withSyncNotificationsSuppressed(async () => {
					expect(syncNotificationsSuppressed()).to.equal(true);
				});
				expect(syncNotificationsSuppressed()).to.equal(true);
			});
			expect(syncNotificationsSuppressed()).to.equal(false);
		});
	});

	it('skips update and delete stamps while a pause is on and still records deletes', () => {
		expect(syncWriteEffect({
			suppressed: true,
			hasUpdated: true,
			hasDeleted: true,
			wiped: false,
		})).to.deep.equal({
			stampUpdated: false,
			recordDeleted: true,
			stampDeleted: false,
			stampWiped: false,
		});
	});

	it('skips the wipe stamp while a pause is on', () => {
		expect(syncWriteEffect({
			suppressed: true,
			hasUpdated: false,
			hasDeleted: false,
			wiped: true,
		}).stampWiped).to.equal(false);
	});

	it('stamps a wipe when the pause is off', () => {
		expect(syncWriteEffect({
			suppressed: false,
			hasUpdated: false,
			hasDeleted: false,
			wiped: true,
		}).stampWiped).to.equal(true);
	});
});
