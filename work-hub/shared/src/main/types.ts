export type WorkHubTab = {
	itemKey: string;
	id: string;
	label: string;
	tag?: string;
	renderArgs: any;
};

export type WorkHubTabGroup_ColorScheme = {
	foreground: string;
	background: string;
}

export type WorkHubTabGroup = {
	groupKey: string;
	label: string;
	color: WorkHubTabGroup_ColorScheme;
	collapsed: boolean;
	tabs: WorkHubTab[];
}