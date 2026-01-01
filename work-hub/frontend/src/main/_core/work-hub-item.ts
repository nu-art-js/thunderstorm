import {Logger} from '@nu-art/ts-common';
import {ModuleFE_WorkHub} from '../_module/index.js';
import {MouseEvent, ReactNode} from 'react';
import {ModuleFE_BaseDB} from "@nu-art/thunder-routing";
import {WorkHubTab} from '@nu-art/work-hub-shared';
import {Component_WorkHubActionMenu} from '../_ui/Component_WorkHubActionMenu/Component_WorkHubActionMenu.js';
import {WorkHubItem_MenuSection} from '../_ui/Component_WorkHubActionMenu/types.js';

type MenuResolver = (tab: WorkHubTab) => (Promise<WorkHubItem_MenuSection[]> | WorkHubItem_MenuSection[]);
type WorkHubItemRenderer<Args extends any = void> = (workHubItem: WorkHubItem<Args>, tabId: string, args: Args) => ReactNode;

export class WorkHubItem<Args extends any = void>
	extends Logger {

	public readonly key: string;
	public modulesToAwait: ModuleFE_BaseDB<any>[] | undefined;
	public renderer: WorkHubItemRenderer<Args>;
	private tabTag: string | undefined;
	private customMenuActionsResolver: MenuResolver;

	// ######################## Builder ########################

	constructor(key: string) {
		super(`WorkHubItem_${key}`);
		this.key = key;
		this.renderer = () => `Renderer not set for work hub item ${this.key}`;
		this.customMenuActionsResolver = () => [];
		ModuleFE_WorkHub.workHubItem.register(this);
	}

	public setRenderer = (renderer: WorkHubItemRenderer<Args>) => {
		this.renderer = renderer;
		return this;
	};

	public setTag = (tag: string) => {
		this.tabTag = tag;
		return this;
	};

	public setModulesToAwait = (modules: ModuleFE_BaseDB<any>[]) => {
		this.modulesToAwait = modules;
		return this;
	};

	public setCustomMenuActionsResolver = (resolver: MenuResolver) => {
		this.customMenuActionsResolver = resolver;
		return this;
	};

	// ######################## Public Methods ########################

	public openTab = (id: string, label: string, args: Args) => {
		ModuleFE_WorkHub.tabs.add({
			itemKey: this.key,
			tag: this.tabTag,
			id,
			label,
			renderArgs: args,
		});
	};

	public closeTab = (tabId: string) => {
		ModuleFE_WorkHub.tabs.remove(tabId);
	};

	public openTabMenu = async (e: MouseEvent<HTMLDivElement>, tab: WorkHubTab) => {
		const customSections = await this.customMenuActionsResolver(tab);
		Component_WorkHubActionMenu.show(e, {
			tabId: tab.id,
			customSections
		});
	};

	public updateArgs = (tabId: string, args: Partial<Args>) => {
		ModuleFE_WorkHub.tabs.updateArgs(tabId, args);
	};
}