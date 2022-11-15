import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {currentTimeMillis, CustomException} from '@nu-art/ts-common';

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


export async function lockedOperation<T>(key: string, timeout: number, action: () => Promise<T>, exception: CustomException = new OperationLockedException('This action is already in progress')): Promise<T> {
	const ref = ModuleBE_Firebase.createAdminSession().getDatabase().ref<number>(`/lock/${key}`);
	try {
		if (currentTimeMillis() < await ref.get(0))
			throw exception;

		ref.set(currentTimeMillis() + timeout);
		return await action();
	} finally {
		ref.delete();
	}
}