import {BaseHttpRequest} from './BaseHttpRequest';
import {Dispatcher} from '@thunder-storm/common';


export interface OnAuthRequiredListener {
	__onAuthRequiredListener(request: BaseHttpRequest<any>): void;
}

export const dispatcher_onAuthRequired = new Dispatcher<OnAuthRequiredListener, '__onAuthRequiredListener'>('__onAuthRequiredListener');