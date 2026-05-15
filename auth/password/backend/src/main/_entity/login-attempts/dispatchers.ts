import {Dispatcher} from '@nu-art/ts-common';
import {DatabaseDef_Account} from '@nu-art/user-account-shared';

export interface OnLoginFailed {
	__onLoginFailed: (accountId: DatabaseDef_Account['id']) => void;
}

export const dispatch_OnLoginFailed = new Dispatcher<OnLoginFailed, '__onLoginFailed'>('__onLoginFailed');
