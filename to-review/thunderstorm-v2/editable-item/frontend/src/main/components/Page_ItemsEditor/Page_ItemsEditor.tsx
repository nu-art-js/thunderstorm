import * as React from 'react';
import {asArray, dbObjectToId, exists, UniqueId} from '@nu-art/ts-common';
import './Page_ItemsEditor.scss';
import {ItemEditor_DefaultList, Props_ListRenderer} from './defaults/ItemEditor_ListRenderer/index.js';
import {ItemEditor_CustomSort, ItemEditor_FilterType, ItemEditor_MapperType} from './types.js';
import {ItemEditor_DefaultFilter, Props_Filter} from './defaults/ItemEditor_DefaultFilter/index.js';
import {TS_Icons} from '@nu-art/ts-styles';
import {EditableDBItem, EditableItem} from '../../core/EditableItem.js';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {_className} from '@nu-art/thunder-core';
import {BaseComponent, InferProps, InferState, LL_H_C, LL_H_T, LL_V_L, TS_ButtonLoader} from '@nu-art/thunder-widgets';
import {TS_Route} from '@nu-art/thunder-routing';
import {ApiCallerEventType, DB_Prototype} from '@nu-art/db-api-shared';
import {Props_EditableItemController} from '../TS_EditableItemController/index.js';
import {URL_TOOLS} from '@nu-art/thunder-core';

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
	EditorRenderer: React.ComponentType<Partial<Props_EditableItemController<Database>>>;
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

export abstract class Page_ItemsEditor<Database extends DB_Prototype<any>, P = {}, S = {}>
	extends BaseComponent<Props_ItemsEditor<Database> & P, State_ItemsEditor<Database> & S> {

	constructor(p: Props_ItemsEditor<Database> & P) {
		super(p);
	}

	componentDidMount() {
		// const selectedId = this.getQueryParam('selected', {} as Database['queryParamDef']['selected'])[this.props.module.dbDef.dbKey];
		// if (!selectedId)
		// 	this.onSelected(this.props.sort(this.props.module.cache.allMutable())[0]);
	}

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		if (nextProps === this.props || nextProps.module !== this.props.module) {
			// @ts-ignore
			delete this[this.props.module.defaultDispatcher.method];
			// @ts-ignore
			this[nextProps.module.defaultDispatcher.method] = (...args: any[]) => this.__onItemUpdated(...args);
		}

		const selectedId = undefined;
		if (!exists(selectedId)) {
			state.editable = this.createEditableItem({} as Database['uiType']);
			this.props.onSelectedItemChanged?.(state.editable);
			return state;
		}
		const item = this.props.module.cache.unique(selectedId);
		if (!exists(item)) {
			this.logError(`Could not find item ${this.props.module.config.dbKey} with id ${selectedId}`);
			this.onSelected();
			this.props.onSelectedItemChanged?.();
			return state;
		}
		state.editable = this.createEditableItem(item);
		this.props.onSelectedItemChanged?.(state.editable);
		state.filter ??= () => true;
		return state;
	}

	private __onItemUpdated = (...params: ApiCallerEventType<Database['dbKey']>): void => {
		const items = asArray(params[1]);
		if (!items.map(dbObjectToId).includes(this.state.editable.get('_id') as string))
			return this.onSelected(items[0]);
		if (params[0] === 'delete' || params[0] === 'delete-multi')
			return this.onSelected();
		return this.reDeriveState();
	};

	private createEditableItem(item: Partial<Database['uiType']>) {
		return new EditableDBItem<Database>({...item}, this.props.module)
			.setOnSaveCompleted(this.onSelected.bind(this))
			.setAutoSave(true);
	}

	render() {
		const List = this.props.ListRenderer || ItemEditor_DefaultList;
		const Filter: Props_ItemsEditor<Database>['Filter'] = this.props.Filter || ItemEditor_DefaultFilter;
		const Editor: Props_ItemsEditor<Database>['EditorRenderer'] = this.props.EditorRenderer;
		const sort = this.props.sort;
		const selectedItem = this.state.editable?.item;
		return <div id={this.props.id} className="editor-page">
			<LL_H_T className={_className(this.props.className ?? 'editor-content', 'match_parent')}>
				<LL_V_L className="items-editor__list">
					<LL_V_L className={'items-editor__list-header-content'}>
						<div className={'items-editor__list-header'}>
							{this.renderHeader()}
						</div>
						<Filter onFilterChanged={filter => this.setState({filter} as InferState<this>)} mapper={this.props.mapper}/>
						{this.renderMenuIcon()}
					</LL_V_L>
					<List contextMenuItems={this.props.contextMenuActions} itemRenderer={this.props.itemRenderer} filter={this.state.filter} selected={selectedItem}
								sort={sort} module={this.props.module} onSelected={this.onSelected.bind(this)}/>
					{this.renderAddNewItem()}
				</LL_V_L>
				<div className="item-editor">
					<Editor item={selectedItem}/>
				</div>
			</LL_H_T>
		</div>;
	}

	protected renderHeader(): React.ReactNode {
		return '';
	}

	protected renderAddNewItem() {
		if (this.props.hideAddItem)
			return '';
		return <Component_AddNewItem entity={this.renderHeader()} onCreateNewItem={async () => this.onSelected({} as Partial<Database['uiType']>)}/>;
	}

	static refactoring_setSelected<Proto extends DB_Prototype<any>>(module: ModuleFE_BaseApi<Proto>, id?: string) {
		const raw = URL_TOOLS.getQueryParameter('selected');
		const selected = (raw ? JSON.parse(raw) : {}) as {
			[dbKey: string]: UniqueId;
		};
		const selectedId = id;
		if (!selectedId)
			delete selected[module.config.dbKey];
		else
			selected[module.config.dbKey] = selectedId;
		URL_TOOLS.setQueryParam('selected', JSON.stringify(selected));
	}

	private onSelected(item?: Partial<Database['uiType']>) {
		Page_ItemsEditor.refactoring_setSelected(this.props.module, item?._id);
		// const selected = this.getQueryParam('selected', {} as CProto['queryParamDef']['selected']);
		//
		// const selectedId = item?._id;
		// if (!selectedId)
		// 	delete selected[this.props.module.dbDef.dbKey];
		// else
		// 	selected[this.props.module.dbDef.dbKey] = selectedId;
		//
		// this.setQueryParam('selected', selected);
		this.reDeriveState();
	}

	private renderMenuIcon = () => {
		if (!this.props.actions)
			return;
		return <TS_Icons.more.component className={'editor--menu-icon'} {...openContent.popUp.bottom('editor--menu', this.renderMenu, 10)}/>;
	};
	private renderMenu = (refreshPopup: VoidFunction) => {
		return <>
			{this.props.actions!.map((action, index) => {
				const actionInProgress = this.state.actionInProgress;
				if (actionInProgress === index)
					return <div key={action.label} className={'editor--loader-wrapper'}>
						<TS_ButtonLoader/>
					</div>;
				const className = _className('editor--menu-action', exists(actionInProgress) && 'disabled');
				return <div key={action.label} className={className} onClick={async () => {
					if (exists(this.state.actionInProgress))
						return;
					this.setState({actionInProgress: index} as InferState<this>, async () => {
						refreshPopup();
						try {
							await action.action(this.state);
							ModuleFE_MouseInteractivity.hide(mouseInteractivity_PopUp);
						} catch (err: any) {
							this.logError(err);
							this.setState({actionInProgress: undefined}, () => refreshPopup());
						}
					});
				}}>
					{action.label}
				</div>;
			})}
		</>;
	};
}

export const Component_AddNewItem = (props: {
	onCreateNewItem: () => Promise<any>;
	entity: React.ReactNode;
}) => {
	return <LL_H_C className="add-item-v3 clickable" onClick={props.onCreateNewItem}>Add new {props.entity}</LL_H_C>;
};
