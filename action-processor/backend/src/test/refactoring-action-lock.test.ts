/*
 * @nu-art/action-processor-backend — refactoring action lock
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {Minute} from '@nu-art/ts-common';
import {
	RefactoringActionLockTimeoutMs,
	refactoringActionLockKey,
	withRefactoringActionLock,
} from '../main/refactoring-action-lock.js';

describe('refactoring action lock', () => {
	it('names the lock by action so two actions do not share it', () => {
		expect(refactoringActionLockKey('setup-project')).to.equal('refactoring-action--setup-project');
		expect(refactoringActionLockKey('knowledge-access-restamp')).to.equal('refactoring-action--knowledge-access-restamp');
		expect(refactoringActionLockKey('setup-project')).to.not.equal(refactoringActionLockKey('knowledge-access-restamp'));
	});

	it('holds the lock for the function time limit', () => {
		expect(RefactoringActionLockTimeoutMs).to.equal(9 * Minute);
	});

	it('runs the action when this process has no Realtime Database', async () => {
		let ran = false;
		const result = await withRefactoringActionLock('setup-project', async () => {
			ran = true;
			return 'done';
		});
		expect(ran).to.equal(true);
		expect(result).to.equal('done');
	});
});
