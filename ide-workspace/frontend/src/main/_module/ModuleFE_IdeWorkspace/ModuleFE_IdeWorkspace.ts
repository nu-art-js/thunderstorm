import {BadImplementationException, Module} from '@nu-art/ts-common';
import {IDE_WORKSPACE_SCHEMA_VERSION, PaneNode, ToolPanel, WorkspaceState} from '@nu-art/ide-workspace-shared';
import {PanelItem} from '../../_core/panel-item.js';

const defaultEditor: PaneNode = {
	type: 'leaf',
	id: 'pane-root',
	tabs: [],
};

class ModuleFE_IdeWorkspace_Class
	extends Module {

	private readonly _panelItemMap: Record<string, PanelItem> = {};
	private _layout: WorkspaceState = {
		schemaVersion: IDE_WORKSPACE_SCHEMA_VERSION,
		panels: [],
		editor: defaultEditor,
	};

	public readonly layout = {
		get: (): WorkspaceState => ({...this._layout, panels: [...this._layout.panels]}),
	};

	public readonly panelItem = {
		register: (item: PanelItem) => {
			this._panelItemMap[item.key] ??= item;
		},
		getByKey: (key: string): PanelItem => {
			if (!this._panelItemMap[key])
				throw new BadImplementationException(`No PanelItem registered for key ${key}`);
			return this._panelItemMap[key];
		},
	};

	public readonly panels = {
		get: (): ToolPanel[] => [...this._layout.panels],
	};
}

export const ModuleFE_IdeWorkspace = new ModuleFE_IdeWorkspace_Class();
