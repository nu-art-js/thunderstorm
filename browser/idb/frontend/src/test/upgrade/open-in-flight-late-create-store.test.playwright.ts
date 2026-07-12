/*
 * Beamz IDB bug: createStore allowed while open() is in flight (openPromise set, this.db unset).
 * Registry hash matches org-only subset → needsUpgrade false → late stores never created in IDB.
 *
 * These tests assert CORRECT behavior (TDD red until IDB_Database is fixed).
 */

import {expect, test} from '@playwright/test';

const testPagePath = '/src/test/index.html';
const dbName = 'test-open-in-flight-late-create';

const allStoreNames = [
	'organization',
	'organization-profile',
	'organization-unit',
	'tag-assignments',
	'tags',
] as const;

type RaceState = {
	physicalStoreNames: string[];
	tagsGetAllError?: string;
	tagsStoreExistsInIdb: boolean;
	tagsGetAllErrorAfterSecondOpen?: string;
};

/** Prior deploy: beamz IDB on disk with 3 org stores + matching registry. */
async function seedPriorOrgOnlyBeamzIdb(page: import('@playwright/test').Page): Promise<void> {
	await page.evaluate(async (name) => {
		const {IDB_Database} = window.IDBFrontend;
		const dbPrior = new IDB_Database(name);
		dbPrior.createStore<{ _id: string }>({name: 'organization', uniqueKeys: ['_id']});
		dbPrior.createStore<{ _id: string }>({name: 'organization-unit', uniqueKeys: ['_id']});
		dbPrior.createStore<{ _id: string }>({name: 'organization-profile', uniqueKeys: ['_id']});
		await dbPrior.open();
		dbPrior.close();
	}, dbName);
}

/** New deploy: org modules trigger open(); tag ModuleFE_* register stores before onsuccess. */
async function runOpenInFlightLateCreateStoreRace(page: import('@playwright/test').Page): Promise<RaceState> {
	return page.evaluate(async (name): Promise<RaceState> => {
		const {IDB_Database} = window.IDBFrontend;
		const db = new IDB_Database(name);

		db.createStore<{ _id: string }>({name: 'organization', uniqueKeys: ['_id']});
		db.createStore<{ _id: string }>({name: 'organization-unit', uniqueKeys: ['_id']});
		db.createStore<{ _id: string }>({name: 'organization-profile', uniqueKeys: ['_id']});

		const openPromise = db.open();
		db.createStore<{ _id: string }>({name: 'tags', uniqueKeys: ['_id']});
		db.createStore<{ _id: string }>({name: 'tag-assignments', uniqueKeys: ['_id']});
		await openPromise;

		const inspectReq = indexedDB.open(name);
		const inspectDb = await new Promise<IDBDatabase>((resolve, reject) => {
			inspectReq.onsuccess = () => resolve(inspectReq.result);
			inspectReq.onerror = () => reject(inspectReq.error);
		});
		const physicalStoreNames = Array.from(inspectDb.objectStoreNames).sort();
		inspectDb.close();

		const tagsStore = db.getStore<{ _id: string }>('tags');
		if (!tagsStore)
			throw new Error('tags store registered in memory but getStore returned undefined');

		let tagsGetAllError: string | undefined;
		try {
			await tagsStore.getAll();
		} catch (e) {
			tagsGetAllError = (e as DOMException)?.name ?? String(e);
		}

		const tagsStoreExistsInIdb = await db.storeExists('tags');

		await db.open();

		let tagsGetAllErrorAfterSecondOpen: string | undefined;
		try {
			await tagsStore.getAll();
		} catch (e) {
			tagsGetAllErrorAfterSecondOpen = (e as DOMException)?.name ?? String(e);
		}

		await db.deleteDatabase();

		return {
			physicalStoreNames,
			tagsGetAllError,
			tagsStoreExistsInIdb,
			tagsGetAllErrorAfterSecondOpen,
		};
	}, dbName);
}

test.describe('IDB_Database - open in flight late createStore (beamz)', () => {
	test.beforeEach(async ({page}) => {
		await page.goto(testPagePath);
		await page.waitForFunction(() => window.IDBFrontend !== undefined);
		await page.evaluate(() => window.IDBFrontend.cleanupAllIDB());
		await seedPriorOrgOnlyBeamzIdb(page);
	});

	test('A — late createStore during open creates physical stores and tags.getAll succeeds', async ({page}) => {
		const state = await runOpenInFlightLateCreateStoreRace(page);

		expect(state.physicalStoreNames).toEqual([...allStoreNames].sort());
		expect(state.tagsGetAllError).toBeUndefined();
		expect(state.tagsStoreExistsInIdb).toBe(true);
	});

	test('B — second open() heals when first open missed late stores', async ({page}) => {
		const state = await runOpenInFlightLateCreateStoreRace(page);

		expect(state.tagsStoreExistsInIdb).toBe(true);
		expect(state.tagsGetAllErrorAfterSecondOpen).toBeUndefined();
		expect(state.physicalStoreNames).toEqual([...allStoreNames].sort());
	});
});
