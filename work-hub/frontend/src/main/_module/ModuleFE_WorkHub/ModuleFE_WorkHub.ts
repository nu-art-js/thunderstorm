import {BadImplementationException, filterInstances, lastElement, mergeObject, Module, removeFromArrayByIndex, removeItemFromArray} from '@nu-art/ts-common';
import {isWorkHubTab, isWorkHubTabGroup, PermissionKeys_WorkHubUI, WorkHubTab, WorkHubTabGroup} from '@nu-art/work-hub-shared';
import {ModuleFE_WorkHub_GroupActions, ModuleFE_WorkHub_TabActions} from './types.js';
import {dispatch_OnWorkHubTabSelected, dispatch_OnWorkHubTabsUpdated} from '../../dispatchers.js';
import {StorageKey} from '@nu-art/thunderstorm-frontend';
import {WorkHubItem} from '../../_core/work-hub-item.js';
import {workHubTabGroupColors} from '../../_ui/Component_WorkHub_Header/renderers/Component_WorkHub_TabGroup/consts.js';
import {ModuleFE_PermissionMapper, PermissionKey_FE} from '@nu-art/permissions-frontend';

class ModuleFE_WorkHub_Class
	extends Module {

	public readonly permissions: ModuleFE_PermissionMapper<typeof PermissionKeys_WorkHubUI>;

	constructor() {
		super();
		this._tabs = this.storage_tabs.get([]);
		this._tabStack = this.storage_tabStack.get([]);
		this._workHubItemMap = {};
		this.permissions = PermissionKey_FE.generatePermissionKeysByLevels(PermissionKeys_WorkHubUI);
		if (this._tabs.length && !this._tabStack.length) {
			let firstTab = this._tabs[0];
			if (isWorkHubTabGroup(firstTab))
				firstTab = firstTab.tabs[0];

			this._tabStack.push(firstTab.id);
		}
	}

	//######################### Class Properties #########################

	private readonly _tabs: (WorkHubTabGroup | WorkHubTab)[];
	private readonly _tabStack: string[];
	private readonly _workHubItemMap: { [key: string]: WorkHubItem };
	private readonly storage_tabs = new StorageKey<(WorkHubTabGroup | WorkHubTab)[]>('work-hub__tabs');
	private readonly storage_tabStack = new StorageKey<string[]>('work-hub__tab-stack');
	private postTabAdditionCallback: VoidFunction | undefined = undefined;

	//######################### Internal Methods #########################

	private tabStack = {
		push: (tabId: string) => {
			this.tabStack.pop(tabId);
			this._tabStack.push(tabId);
			this.storage_tabStack.set([...this._tabStack]);
		},
		pop: (tabId: string) => {
			removeItemFromArray(this._tabStack, tabId);
			this.storage_tabStack.set([...this._tabStack]);
		},
	};

	private clearTab = (tabId: string) => {
		const index = this._tabs.findIndex(i => isWorkHubTab(i) && i.id === tabId);
		if (index !== -1)
			removeFromArrayByIndex(this._tabs, index);
		else
			this._tabs.forEach(i => {
				if (isWorkHubTabGroup(i))
					i.tabs = i.tabs.filter(t => t.id !== tabId);
			});
	};

	private clearEmptyGroups = () => {
		while (true) {
			const index = this._tabs.findIndex(i => isWorkHubTabGroup(i) && i.tabs.length === 0);
			if (index === -1)
				break;

			removeFromArrayByIndex(this._tabs, index);
		}
	};

	//######################### Public Methods #########################

	public tabs: ModuleFE_WorkHub_TabActions = {
		get: () => [...this._tabs],
		getFlat: () => this._tabs.reduce((arr, item) => {
			if (isWorkHubTabGroup(item))
				arr.push(...item.tabs);
			else
				arr.push(item);
			return arr;
		}, [] as WorkHubTab[]),
		select: (tabId) => {
			this.tabStack.push(tabId);
			dispatch_OnWorkHubTabSelected.dispatchUI();
		},
		add: (tab, setAsSelected = true) => {
			if (this.tabs.getFlat().find(_tab => _tab.id === tab.id)) {
				if (setAsSelected)
					this.tabs.select(tab.id);
				return;
			} else {
				this._tabs.push(tab);
				this.storage_tabs.set([...this._tabs]);
				if (setAsSelected)
					this.tabStack.push(tab.id);

				dispatch_OnWorkHubTabsUpdated.dispatchUI();
				this.postTabAdditionCallback?.();
			}
		},
		remove: (tabId) => {
			const index = this._tabs.findIndex(tab => isWorkHubTab(tab) && tab.id === tabId);
			if (index !== -1) {
				removeFromArrayByIndex(this._tabs, index);
			} else { //Assume the tab is in a group and clean it out
				this._tabs.forEach(item => {
					if (isWorkHubTabGroup(item))
						item.tabs = item.tabs.filter(tab => tab.id !== tabId);
				});
			}

			this.clearEmptyGroups();
			this.storage_tabs.set([...this._tabs]);
			this.tabStack.pop(tabId);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		getSelected: () => {
			const selectedId = lastElement(this._tabStack);
			if (!selectedId)
				return;

			return this.tabs.getFlat().find(i => i.id === selectedId);
		},
		updateArgs: (tabId: string, args: any) => {
			const tab = this.tabs.getFlat().find(tab => tab.id === tabId);
			if (!tab)
				return;

			tab.renderArgs = mergeObject({...tab.renderArgs}, args);
			this.storage_tabs.set([...this._tabs]);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		removeFromGroup: (tabId) => {
			const group = this._tabs.find(g => isWorkHubTabGroup(g) && g.tabs.find(t => t.id === tabId)) as WorkHubTabGroup;
			if (!group)
				return;

			const tab = group.tabs.find(i => i.id === tabId)!;
			group.tabs = group.tabs.filter(i => i.id !== tabId);
			this._tabs.push(tab);
			this.clearEmptyGroups();
			this.storage_tabs.set([...this._tabs]);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		}
	};

	public group: ModuleFE_WorkHub_GroupActions = {
		get: (key) => {
			return this._tabs.find(i => isWorkHubTabGroup(i) && i.groupKey === key) as WorkHubTabGroup | undefined;
		},
		getKeyForTabId: (tabId) => {
			return (this._tabs.find(i => isWorkHubTabGroup(i) && i.tabs.find(t => t.id === tabId)) as WorkHubTabGroup)?.groupKey;
		},
		create: (key, tabId, newTabs = [], customGroupName?: string) => {
			const tab = this.tabs.getFlat().find(t => t.id === tabId);
			if (!tab)
				throw new BadImplementationException('Passed tabId does not point to an existing tab');

			const index = this._tabs.indexOf(tab);

			const newGroup: WorkHubTabGroup = {
				groupKey: key,
				label: customGroupName ?? 'New Group',
				color: workHubTabGroupColors[0],
				collapsed: false,
				tabs: [tab, ...newTabs],
			};
			if (index === -1) { //Existing tab was inside another group
				//Clean all other groups of this tab
				this.clearTab(tabId);
				//Push new group at the end
				this._tabs.push(newGroup);
			} else {//Tab was not grouped
				//Push new group instead of the tab
				this._tabs.splice(index, 1, newGroup);
			}
			this.storage_tabs.set([...this._tabs]);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		addTabs: (key, tabs) => {
			const group = this._tabs.find(i => isWorkHubTabGroup(i) && i.groupKey === key) as WorkHubTabGroup;
			if (!group)
				throw new BadImplementationException('Passed key does not point to an existing group');

			const resolvedTabs = filterInstances(tabs.map(tab => {
				const resolved = typeof tab === 'string' ? this.tabs.getFlat().find(t => t.id === tab) : tab;
				if (!resolved)
					throw new BadImplementationException(`Could not resolve tab for id ${tab}`);

				if (group.tabs.find(t => t.id === resolved.id))
					return;

				this.clearTab(resolved.id);
				return resolved;
			}));

			if (!resolvedTabs.length)
				return;

			group.tabs.push(...resolvedTabs);
			this.clearEmptyGroups();
			this.storage_tabs.set([...this._tabs]);
			this.tabStack.push(resolvedTabs[0].id);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		update: (key, data) => {
			const index = this._tabs.findIndex(g => isWorkHubTabGroup(g) && g.groupKey === key);
			if (index === -1)
				throw new BadImplementationException(`Could not find group for key ${key}`);

			this._tabs[index] = mergeObject(this._tabs[index], data);
			this.storage_tabs.set([...this._tabs]);
			dispatch_OnWorkHubTabsUpdated.dispatchUI();
		},
		unGroup: (key) => {

		},
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

	public setPostTabAdditionCallback = (callback: VoidFunction) => this.postTabAdditionCallback = callback;
}

export const ModuleFE_WorkHub = new ModuleFE_WorkHub_Class();