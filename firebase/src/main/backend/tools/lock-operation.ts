import {currentTimeMillis, CustomException} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '../ModuleBE_Firebase';


/**
 * # <ins>OperationLockedException</ins>
 * This class inherits {@link CustomException} and functions like it, after setting the exceptionType property as "OperationLockedException",
 * @category - Exceptions
 */
export class OperationLockedException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(OperationLockedException, message, cause);
	}
}

type FirebaseLock = { status: 'LOCKED' | 'UNLOCKED', timeout: number };

const FirebaseLockState_LOCKED = 'LOCKED';
const FirebaseLockState_UNLOCKED = 'UNLOCKED';

export async function lockedOperation<T>(key: string, timeout: number, action: () => Promise<T>, exception: CustomException = new OperationLockedException('This action is already in progress')): Promise<T> {
	const ref = ModuleBE_Firebase.createAdminSession().getDatabase().ref<FirebaseLock>(`/lock/${key}`);
	const now = currentTimeMillis();

	const transactionResult = await ref.transaction(current => {
		// Check if the lock is held and not expired
		if (current && current.status === FirebaseLockState_LOCKED && now < current.timeout) {
			return current; // Returning current to keep the existing value
		}
		// Lock is either not held or expired, so we can acquire it
		return {status: FirebaseLockState_LOCKED, timeout: now + timeout};
	});

	// Check if the transaction was committed and lock was acquired
	if (!transactionResult.committed || transactionResult.value.status !== FirebaseLockState_LOCKED)
		throw exception; // Lock could not be acquired

	try {
		return await action();
	} finally {
		await ref.patch({status: FirebaseLockState_UNLOCKED}); // Setting the status to 'UNLOCKED'
	}
}