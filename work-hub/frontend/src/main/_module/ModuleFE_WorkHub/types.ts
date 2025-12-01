import {WorkHubTab} from '@nu-art/work-hub-shared';

export type ModuleFE_WorkHub_TabActions = {
	get: () => WorkHubTab[];
	select: (tabId: string) => void;
	add: (tab: WorkHubTab, setAsSelected?: boolean) => void;
	remove: (tabId: string) => void;
	getSelected: () => WorkHubTab | undefined;
	updateArgs: (tabId: string, args: any) => void;
}