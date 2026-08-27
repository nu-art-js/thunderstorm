import {ThunderDispatcher} from './thunder-dispatcher.js';

export interface OnClearWebsiteData {
	__onClearWebsiteData(): void | Promise<void>;
}

export const dispatch_onClearWebsiteData = new ThunderDispatcher<OnClearWebsiteData, '__onClearWebsiteData'>('__onClearWebsiteData');