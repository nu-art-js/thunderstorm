import {ThunderDispatcher} from './thunder-dispatcher';

export interface OnPageTitleChangedListener {
	__onPageTitleChanged(title: string): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, '__onPageTitleChanged'>('__onPageTitleChanged');