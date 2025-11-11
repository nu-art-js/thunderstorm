import {Dispatcher, UniqueId} from '@nu-art/ts-common';

export interface OnLoginFailed {
	__onLoginFailed: (accountId: UniqueId) => void;
}

export const dispatch_OnLoginFailed = new Dispatcher<OnLoginFailed, '__onLoginFailed'>('__onLoginFailed');