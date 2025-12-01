export type WorkHubItem_MenuAction = {
	label: string;
	action: () => (Promise<void> | void);
	disabled?: boolean;
};

export type WorkHubItem_MenuSection = {
	label?: string;
	actions: WorkHubItem_MenuAction[];
}