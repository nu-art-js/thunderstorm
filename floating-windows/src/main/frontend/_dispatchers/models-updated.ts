import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';

export interface FloatingWindows_WindowsUpdated {
	__onFloatingWindowsUpdated: VoidFunction;
}

export const dispatch_FloatingWindows_WindowsUpdated = new ThunderDispatcher<FloatingWindows_WindowsUpdated, '__onFloatingWindowsUpdated'>('__onFloatingWindowsUpdated');