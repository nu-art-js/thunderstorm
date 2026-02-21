import {ThunderDispatcher} from '@nu-art/thunder-core';

export interface FloatingWindows_WindowsUpdated {
	__onFloatingWindowsUpdated: VoidFunction;
}

export const dispatch_FloatingWindows_WindowsUpdated = new ThunderDispatcher<FloatingWindows_WindowsUpdated, '__onFloatingWindowsUpdated'>('__onFloatingWindowsUpdated');