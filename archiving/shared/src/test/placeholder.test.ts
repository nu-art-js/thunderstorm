/*
 * @nu-art/archiving-shared - tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {assert} from 'chai';
import type {RequestBody_HardDeleteUnique, RequestQuery_DeleteAll, RequestQuery_GetHistory} from '../main/apis.js';
import {ApiDef_Archiving} from '../main/apis.js';

describe('archiving-shared', () => {
	it('RequestBody_HardDeleteUnique has _id and collectionName', () => {
		const r: RequestBody_HardDeleteUnique = {_id: 'id1', collectionName: 'col1'};
		assert.equal(r._id, 'id1');
		assert.equal(r.collectionName, 'col1');
	});
	it('RequestQuery_DeleteAll has collectionName', () => {
		const r: RequestQuery_DeleteAll = {collectionName: 'col1'};
		assert.equal(r.collectionName, 'col1');
	});
	it('RequestQuery_GetHistory has _id and collectionName', () => {
		const r: RequestQuery_GetHistory = {_id: 'id1', collectionName: 'col1'};
		assert.equal(r._id, 'id1');
		assert.equal(r.collectionName, 'col1');
	});
	it('ApiDef_Archiving has vv1 paths', () => {
		assert.equal(ApiDef_Archiving.vv1.hardDeleteAll.path, 'v1/archiving/hard-delete-all');
		assert.equal(ApiDef_Archiving.vv1.hardDeleteUnique.path, 'v1/archiving/hard-delete-unique');
		assert.equal(ApiDef_Archiving.vv1.getDocumentHistory.path, 'v1/archiving/get-document-history');
	});
});
