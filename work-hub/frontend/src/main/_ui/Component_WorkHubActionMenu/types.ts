import { ResolvableContent } from "@nu-art/ts-common";

export type WorkHubItem_MenuAction = {
	label: string;
	action?: () => (Promise<void> | void);
	visible?: ResolvableContent<boolean>; //Decides whether the action appears in the menu to begin with (default true)
	disabled?: ResolvableContent<boolean>; //Decides whether the action is disabled (default false)
	separatorAfter?: boolean;
	innerActions?: WorkHubItem_MenuAction[];
};

export type WorkHubItem_MenuSection = {
	label?: string;
	actions: WorkHubItem_MenuAction[];
}