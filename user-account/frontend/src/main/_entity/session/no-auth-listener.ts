import {Dispatcher} from '@nu-art/ts-common';


export interface OnAuthRequiredListener {
	__onAuthRequiredListener(): void;
}

export const dispatcher_onAuthRequired = new Dispatcher<OnAuthRequiredListener, '__onAuthRequiredListener'>('__onAuthRequiredListener');
