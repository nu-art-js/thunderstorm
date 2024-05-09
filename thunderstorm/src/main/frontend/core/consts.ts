import {ThunderDispatcher} from './thunder-dispatcher';
import {ReactNode} from 'react';


export interface OnPageTitleChangedListener {
	__onPageTitleChanged(title: ReactNode): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, '__onPageTitleChanged'>('__onPageTitleChanged');