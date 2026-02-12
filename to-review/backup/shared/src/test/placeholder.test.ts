/*
 * @nu-art/backup-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import {ApiDef_BackupDoc} from '../main/apis.js';

describe('backup-shared', () => {
	it('ApiDef_BackupDoc has _v1 paths', () => {
		assert.equal(ApiDef_BackupDoc._v1.initiateBackup.path, 'v1/initiate-backup-v2');
		assert.equal(ApiDef_BackupDoc._v1.fetchBackupDocs.path, 'v1/fetch-backup-docs-v2');
	});
});
