import {ThunderDispatcher} from '../core/thunder-dispatcher';

export interface OnClearWebsiteData {
	__onClearWebsiteData(resync: boolean): void;
}

export const dispatch_onClearWebsiteData = new ThunderDispatcher<OnClearWebsiteData, '__onClearWebsiteData'>('__onClearWebsiteData');