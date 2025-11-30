import {BadImplementationException, lastElement, mergeObject, Module, removeFromArrayByIndex, removeItemFromArray} from '@nu-art/ts-common';
import {WorkHubTab} from '@nu-art/work-hub-shared';
import {ModuleFE_WorkHub_TabActions} from './types.js';
import {dispatch_OnWorkHubTabSelected, dispatch_OnWorkHubTabsUpdated} from '../../dispatchers.js';
import {StorageKey} from '@nu-art/thunderstorm-frontend';
import {WorkHubItem} from '../../_core/work-hub-item.js';

class ModuleFE_WorkHub_Class
	extends Module {

	constructor() {
		super();
		this._tabs = this.storage_tabs.get([]);
		this._tabStack = this.storage_tabStack.get([]);
		this._workHubItemMap = {};
	}

	//######################### Class Properties #########################

	private readonly _tabs: WorkHubTab[];
	private readonly _tabStack: string[];
	private readonly _workHubItemMap: { [key: string]: WorkHubItem };
	private readonly storage_tabs = new StorageKey<WorkHubTab[]>('work-hub__tabs');
	private readonly storage_tabStack = new StorageKey<string[]>('work-hub__tab-stack');

	//######################### Internal Methods #########################

	private tabStack = {
		push: (tabId: string) => {
			this.tabStack.pop(tabId);
			this._tabStack.push(tabId);
			this.storage_tabStack.set(this._tabStack);
		},
		pop: (tabId: string) => {
			removeItemFromArray(this._tabStack, tabId);
			this.storage_tabStack.set(this._tabStack);
		},
	};

	//######################### Public Methods #########################

	public tabs: ModuleFE_WorkHub_TabActions = {
		get: () => [...this._tabs],
		select: (tabId) => {
			this.tabStack.push(tabId);
			dispatch_OnWorkHubTabSelected.dispatchUI();
		},
		add: (tab, setAsSelected = true) => {
			if (this._tabs.find(_tab => _tab.id === tab.id)) {
				if (setAsSelected)
					this.tabs.select(tab.id);
				return;
			} else {
				this._tabs.push(tab);
				this.storage_tabs.set(this._tabs);
				if (setAsSelected)
					this.tabStack.push(tab.id);

				dispatch_OnWorkHubTabsUpdated.dispatchUI();
			}
		},
		remove: (tabId) => {
			const index = this._tabs.findIndex(tab => tab.id === tabId);
			if (index === -1)
				return;

			removeFromArrayByIndex(this._tabs, index);
			this.storage_tabs.set(this._tabs);
			this.tabStack.pop(tabId);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		getSelected: () => {
			const selectedId = lastElement(this._tabStack);
			if (!selectedId)
				return;

			return this._tabs.find(i => i.id === selectedId);
		},
		updateArgs: (tabId: string, args: any) => {
			const tab = this._tabs.find(tab => tab.id === tabId);
			if (!tab)
				return;

			tab.renderArgs = mergeObject({...tab.renderArgs}, args);
			this.storage_tabs.set(this._tabs);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		}
	};

	public workHubItem = {
		register: (item: WorkHubItem<any>) => {
			this._workHubItemMap[item.key] ??= item;
		},
		getByKey: (key: string): WorkHubItem<any> => {
			if (!this._workHubItemMap[key])
				throw new BadImplementationException(`No WorkHubItem registered for key ${key}`);
			return this._workHubItemMap[key];
		}
	};
}

export const ModuleFE_WorkHub = new ModuleFE_WorkHub_Class();