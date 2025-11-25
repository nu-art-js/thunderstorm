import {Module, removeFromArrayByIndex, removeItemFromArray} from '@nu-art/ts-common';
import {WorkHubTab} from '@nu-art/work-hub-shared';
import {ModuleFE_WorkHub_TabActions} from './types.js';

class ModuleFE_WorkHub_Class
	extends Module {

	//######################### Class Properties #########################

	private _tabs: WorkHubTab[] = [];
	private _tabStack: string[] = [];

	//######################### Internal Methods #########################

	private tabStack = {
		push: (tabId: string) => {
			this.tabStack.pop(tabId);
			this._tabStack.push(tabId);
		},
		pop: (tabId: string) => {
			removeItemFromArray(this._tabStack, tabId);
		}
	};

	//######################### Public Methods #########################

	public tabs: ModuleFE_WorkHub_TabActions = {
		get: () => this._tabs,
		select: (tabId) => {
			this.tabStack.push(tabId);
		},
		add: (tab, setAsSelected = true) => {
			this._tabs.push(tab);
			if (setAsSelected)
				this.tabStack.push(tab.id);
		},
		remove: (tabId) => {
			const index = this._tabs.findIndex(tab => tab.id === tabId);
			if (index === -1)
				return;

			removeFromArrayByIndex(this._tabs, index);
			this.tabStack.pop(tabId);
		}
	};
}

export const ModuleFE_WorkHub = new ModuleFE_WorkHub_Class();