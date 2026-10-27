/*
 * @nu-art/git-like-backend - GitLike_Branch contract and active-branch context
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {DBDef_GitLike_Branch} from '@nu-art/git-like-shared';
import type {DatabaseDef_GitLike_Branch, UI_GitLike_Branch} from '@nu-art/git-like-shared';
import {ModuleBE_GitLike_BranchDB} from '../main/_entity/branch/ModuleBE_GitLike_BranchDB.js';

const branchId = 'a'.repeat(32) as DatabaseDef_GitLike_Branch['id'];

describe('GitLike_Branch', () => {
	it('accepts label and reviewRequired', () => {
		const result = tsValidateResult(
			{label: 'design', reviewRequired: true},
			DBDef_GitLike_Branch.modifiablePropsValidator,
		);
		expect(result).to.equal(undefined);
	});

	it('rejects a missing label', () => {
		const result = tsValidateResult(
			{reviewRequired: false} as UI_GitLike_Branch,
			DBDef_GitLike_Branch.modifiablePropsValidator,
		);
		expect(result).to.not.equal(undefined);
	});

	it('treats an unset branch id as live and enter selects one branch', async () => {
		await new MemStorage().init(async () => {
			expect(ModuleBE_GitLike_BranchDB.activeBranchId()).to.equal(undefined);
			ModuleBE_GitLike_BranchDB.enter(branchId);
			expect(ModuleBE_GitLike_BranchDB.activeBranchId()).to.equal(branchId);
		});
	});
});
