/*
 * @nu-art/sync-manager-backend - Public sync path wiring
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../main/ModuleBE_SyncManager.ts'), 'utf8');

describe('sync manager public path', () => {
	it('writes stamps with the shared public helper and deletes that node on env sync', () => {
		expect(source).to.include('privateModuleStatePath(this.getName())');
		expect(source).to.include('syncDataNodePath(this.getName())');
		expect(source).to.include('publicModuleStatePath(this.getName())');
		expect(source).to.include('this.publicSyncDataPath()');
	});
});
