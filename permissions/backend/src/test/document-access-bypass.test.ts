/*
 * @nu-art/permissions-backend — document access stays off during an authorized purge
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {MemKey_DocumentAccessBypass, withDocumentAccessBypass} from '../main/document-access-enforcement.js';

describe('document access bypass', () => {
	it('is off unless a purge turns it on', async () => {
		await new MemStorage().init(async () => {
			expect(MemKey_DocumentAccessBypass.get(false)).to.equal(false);
		});
	});

	it('stays on for the purge and turns off after', async () => {
		await new MemStorage().init(async () => {
			let seen = false;
			await withDocumentAccessBypass(async () => {
				seen = MemKey_DocumentAccessBypass.get(false);
			});
			expect(seen).to.equal(true);
			expect(MemKey_DocumentAccessBypass.get(false)).to.equal(false);
		});
	});

	it('keeps an outer purge on when an inner purge ends', async () => {
		await new MemStorage().init(async () => {
			await withDocumentAccessBypass(async () => {
				await withDocumentAccessBypass(async () => {
					expect(MemKey_DocumentAccessBypass.get(false)).to.equal(true);
				});
				expect(MemKey_DocumentAccessBypass.get(false)).to.equal(true);
			});
			expect(MemKey_DocumentAccessBypass.get(false)).to.equal(false);
		});
	});
});
