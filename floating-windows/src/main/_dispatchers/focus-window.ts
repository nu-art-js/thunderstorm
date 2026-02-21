import {ThunderDispatcher} from '@nu-art/thunder-core';

export interface FloatingWindows_FocusWindow {
	__onFocusFloatingWindow: (windowKey: string) => void;
}

export const dispatcher_FloatingWindows_FocusWindow = new ThunderDispatcher<FloatingWindows_FocusWindow, '__onFocusFloatingWindow'>('__onFocusFloatingWindow');