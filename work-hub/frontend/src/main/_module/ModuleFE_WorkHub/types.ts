import {WorkHubTab} from '@nu-art/work-hub-shared';

export type ModuleFE_WorkHub_TabActions = {
	get: () => WorkHubTab[];
	select: (tabId: string) => void;
	add: (tab: WorkHubTab, setAsSelected?: boolean) => void;
	remove: (tabId: string) => void;
	getSelectedId: () => string | undefined;
}