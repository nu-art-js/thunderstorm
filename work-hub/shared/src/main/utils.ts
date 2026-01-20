import {WorkHubTab, WorkHubTabGroup} from './types.js';

export function isWorkHubTabGroup(item: WorkHubTabGroup | WorkHubTab): item is WorkHubTabGroup {
	return 'groupKey' in item;
}

export function isWorkHubTab(item: WorkHubTabGroup | WorkHubTab): item is WorkHubTab {
	return !isWorkHubTabGroup(item);
}