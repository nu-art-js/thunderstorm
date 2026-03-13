/**
 * Contract types for the generic DB items editor (Page_ItemsEditor).
 * Shared by TS_EditableItemController and the items-editor package.
 */
import * as React from 'react';
import type {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import type {TS_Route} from '@nu-art/thunder-routing';
import type {EditableItem} from './core/EditableItem.js';

export type ItemEditor_FilterType<Proto extends DB_Prototype<any>> = (item: Proto['uiType']) => boolean;
export type ItemEditor_CustomSort<Proto extends DB_Prototype<any>> = (item: Proto['uiType'][]) => Proto['uiType'][];
export type ItemEditor_MapperType<Proto extends DB_Prototype<any>> = (item: Proto['uiType']) => string[];

/** Minimal props passed from Page_ItemsEditor to the editor component (e.g. TS_EditableItemController). */
export type ItemEditor_EditorProps<Database extends DB_Prototype<any>> = {
	item?: Readonly<Partial<Database['uiType']>> | string;
};

export type Props_ListRenderer<Database extends DB_Prototype<any>> = {
	module: ModuleFE_BaseApi<Database>;
	selected?: Partial<Database['uiType']>;
	filter: ItemEditor_FilterType<Database>;
	onSelected: (item: Database['uiType']) => void;
	sort: ItemEditor_CustomSort<Database>;
	itemRenderer: (item: Database['uiType']) => JSX.Element;
	contextMenuItems: MenuAction<Database>[];
};

export type Props_Filter<Proto extends DB_Prototype<any>> = {
	onFilterChanged: (filter: ItemEditor_FilterType<Proto>) => void;
	mapper: ItemEditor_MapperType<Proto>;
};

export type MenuAction<Proto extends DB_Prototype<any>> = {
	label: string;
	action: (state: State_ItemsEditor<Proto>) => Promise<any>;
};

export type State_ItemsEditor<Database extends DB_Prototype<any>> = {
	editable: EditableItem<Database['uiType']>;
	filter: ItemEditor_FilterType<Database>;
	actionInProgress?: number;
};

export type Props_ItemsEditor<Database extends DB_Prototype<any>> = {
	ListRenderer?: React.ComponentType<Props_ListRenderer<Database>>;
	EditorRenderer: React.ComponentType<Partial<ItemEditor_EditorProps<Database>>>;
	Filter?: React.ComponentType<Props_Filter<Database>>;
	module: ModuleFE_BaseApi<Database>;
	route?: TS_Route<{
		_id: string;
	}>;
	sort: ItemEditor_CustomSort<Database>;
	mapper: ItemEditor_MapperType<Database>;
	itemRenderer: (item: Database['uiType']) => JSX.Element;
	actions: MenuAction<Database>[];
	id?: string;
	onSelectedItemChanged?: (editable?: EditableItem<Database['uiType']>) => void;
	contextMenuActions: MenuAction<Database>[];
	hideAddItem: boolean;
	className?: string;
};
