import {ThunderDispatcher} from '../core/thunder-dispatcher';

export interface OnClearWebsiteData {
	__onClearWebsiteData(): void;
}

export const dispatch_onClearWebsiteData = new ThunderDispatcher<OnClearWebsiteData, '__onClearWebsiteData'>('__onClearWebsiteData');