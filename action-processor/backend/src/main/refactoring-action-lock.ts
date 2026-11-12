/*
 * @nu-art/action-processor-backend — one refactoring action at a time across instances
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import {lockedOperation, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {Minute} from '@nu-art/ts-common';

/** Matches the Cloud Function limit so a killed action cannot leave the lock held. */
export const RefactoringActionLockTimeoutMs = 9 * Minute;

export function refactoringActionLockKey(actionKey: string): string {
	return `refactoring-action--${actionKey}`;
}

/**
 * One run of this action at a time, on this instance or another.
 * A process with no Realtime Database URL runs the action with no lock. Tests are that process.
 */
export async function withRefactoringActionLock<T>(actionKey: string, action: () => Promise<T>): Promise<T> {
	const databaseURL = ModuleBE_Firebase.createAdminSession().app.options.databaseURL;
	if (!databaseURL)
		return action();

	return lockedOperation(
		refactoringActionLockKey(actionKey),
		RefactoringActionLockTimeoutMs,
		action,
		HttpCodes._4XX.LOCKED('This action is already in progress'),
	);
}
