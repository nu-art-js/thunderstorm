import {BaseHttpRequest} from '../../../../http-infra/shared/src/main/BaseHttpRequest.js';
import {Dispatcher} from '@nu-art/ts-common';


export interface OnAuthRequiredListener {
	__onAuthRequiredListener(request?: BaseHttpRequest<any>): void;
}

export const dispatcher_onAuthRequired = new Dispatcher<OnAuthRequiredListener, '__onAuthRequiredListener'>('__onAuthRequiredListener');
