import {WorkHubTab, WorkHubTabGroup} from '@nu-art/work-hub-shared';

export type ModuleFE_WorkHub_TabActions = {
	get: () => (WorkHubTabGroup | WorkHubTab)[];
	getFlat: () => WorkHubTab[];
	select: (tabId: string) => void;
	add: (tab: WorkHubTab, setAsSelected?: boolean) => void;
	remove: (tabId: string) => void;
	getSelected: () => WorkHubTab | undefined;
	updateArgs: (tabId: string, args: any) => void;
	removeFromGroup: (tabId: string) => void;
}

export type ModuleFE_WorkHub_GroupActions = {
	get: (key: string) => WorkHubTabGroup | undefined;
	getKeyForTabId: (tabId: string) => string | undefined;
	create: (key: string, tabId: string, newTabs?: WorkHubTab[], customGroupName?: string) => void;
	addTabs: (key: string, tabs: (string | WorkHubTab)[]) => void;
	update: (key: string, data: Partial<WorkHubTabGroup>) => void;
	unGroup: (key: string) => void;
}