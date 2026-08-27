export const IDE_WORKSPACE_SCHEMA_VERSION = 1 as const;

export type DockEdge = 'left' | 'right' | 'bottom';

export type PanelMode = 'docked' | 'floating' | 'closed';

export type ToolPanelFloatGeometry = {
	x: number;
	y: number;
	w: number;
	h: number;
};

export type ToolPanel = {
	id: string;
	itemKey: string;
	title: string;
	edge: DockEdge;
	mode: PanelMode;
	float: ToolPanelFloatGeometry;
};

export type EditorTab = {
	id: string;
	itemKey: string;
	label: string;
	renderArgs?: unknown;
};

export type PaneNode_Leaf = {
	type: 'leaf';
	id: string;
	tabs: EditorTab[];
	activeTabId?: string;
};

export type PaneNode_Split = {
	type: 'split';
	id: string;
	dir: 'row' | 'column';
	children: PaneNode[];
};

export type PaneNode = PaneNode_Leaf | PaneNode_Split;

export type WorkspaceState = {
	schemaVersion: typeof IDE_WORKSPACE_SCHEMA_VERSION;
	panels: ToolPanel[];
	editor: PaneNode;
};
