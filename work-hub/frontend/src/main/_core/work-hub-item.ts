import {Logger} from '@nu-art/ts-common';
import {ModuleFE_WorkHub} from '../_module/index.js';
import {ReactNode} from 'react';
import {ModuleFE_BaseDB} from '@nu-art/thunderstorm-frontend';

export class WorkHubItem<Args extends any = void>
	extends Logger {

	public readonly key: string;
	public modulesToAwait: ModuleFE_BaseDB<any>[] | undefined;
	public renderer: (workHubItem: WorkHubItem<Args>, args: Args) => ReactNode;
	private tabTag: string | undefined;

	constructor(key: string) {
		super(`WorkHubItem_${key}`);
		this.key = key;
		this.renderer = () => `Renderer not set for work hub item ${this.key}`;
		ModuleFE_WorkHub.workHubItem.register(this);
	}

	public setRenderer = (renderer: (workHubItem: WorkHubItem<Args>, args: Args) => ReactNode) => {
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

	public openTab = (id: string, label: string, args: Args) => {
		ModuleFE_WorkHub.tabs.add({
			itemKey: this.key,
			tag: this.tabTag,
			id,
			label,
			renderArgs: args,
		});
	};
}