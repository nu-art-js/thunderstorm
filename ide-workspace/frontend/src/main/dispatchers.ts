import {ThunderDispatcher} from '@nu-art/thunder-core';

export interface OnIdeWorkspaceLayout {
	__onIdeWorkspaceLayoutUpdated: VoidFunction;
}

export const dispatch_OnIdeWorkspaceLayoutUpdated = new ThunderDispatcher<OnIdeWorkspaceLayout, '__onIdeWorkspaceLayoutUpdated'>('__onIdeWorkspaceLayoutUpdated');
