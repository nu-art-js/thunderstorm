import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';

export interface FloatingWindows_FocusWindow {
	__onFocusFloatingWindow: (windowKey: string) => void;
}

export const dispatcher_FloatingWindows_FocusWindow = new ThunderDispatcher<FloatingWindows_FocusWindow, '__onFocusFloatingWindow'>('__onFocusFloatingWindow');