/*
 * @nu-art/sync-manager-frontend - Public sync listener path
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../main/modules/ModuleFE_SyncManager.ts'), 'utf8');

describe('sync listener path', () => {
	it('listens on the shared public sync node', () => {
		// The value is locked in sync-manager-shared publicSyncDataPath('ModuleBE_SyncManager').
		expect(source).to.include("export const Default_SyncManagerNodePath = publicSyncDataPath('ModuleBE_SyncManager');");
	});
});
