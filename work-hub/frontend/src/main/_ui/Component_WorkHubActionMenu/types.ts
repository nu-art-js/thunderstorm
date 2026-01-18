export type WorkHubItem_MenuAction = {
	label: string;
	action?: () => (Promise<void> | void);
	disabled?: boolean;
	separatorAfter?: boolean;
	innerActions?: WorkHubItem_MenuAction[];
};

export type WorkHubItem_MenuSection = {
	label?: string;
	actions: WorkHubItem_MenuAction[];
}