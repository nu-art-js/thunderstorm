import {ReactNode} from 'react';
import {ThunderDispatcher} from '@nu-art/web-client';

export interface OnPageTitleChangedListener {
	__onPageTitleChanged(title: ReactNode): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, '__onPageTitleChanged'>('__onPageTitleChanged');