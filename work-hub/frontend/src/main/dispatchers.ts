import {ThunderDispatcher} from '@nu-art/thunderstorm-frontend';

export interface OnWorkHubTabs {
	__onWorkHubTabsUpdated: VoidFunction;
	__onWorkHubTabSelected: VoidFunction;
}

export const dispatch_OnWorkHubTabsUpdated = new ThunderDispatcher<OnWorkHubTabs, '__onWorkHubTabsUpdated'>('__onWorkHubTabsUpdated');
export const dispatch_OnWorkHubTabSelected = new ThunderDispatcher<OnWorkHubTabs, '__onWorkHubTabSelected'>('__onWorkHubTabSelected');