import {ThunderDispatcher} from './thunder-dispatcher.js';
import {ReactNode} from 'react';

export const thunderstormATSGroups = 'Thunderstorm Components';
export const thunderstormCapabilitiesGroup = 'Thunderstorm Capabilities';

export interface OnPageTitleChangedListener {
	__onPageTitleChanged(title: ReactNode): void;
}

export const dispatch_onPageTitleChanged = new ThunderDispatcher<OnPageTitleChangedListener, '__onPageTitleChanged'>('__onPageTitleChanged');