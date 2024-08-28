import * as React from 'react';
import {asArray, DB_Object, dbObjectToId, DBProto, exists, sortArray, UniqueId} from '@thunder-storm/common';
import {FrameLayout} from '../FrameLayout';
import {TS_Route} from '../../modules/routing';
import {LL_H_C, LL_H_T, LL_V_L} from '../Layouts';
import './Page_ItemsEditor.scss';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {EditableDBItemV3, EditableItem} from '../../utils/EditableItem';
import {ItemEditor_DefaultList, Props_ListRenderer} from './defaults/ItemEditor_ListRenderer';
import {ItemEditor_FilterType, ItemEditor_MapperType, ItemEditor_SortType} from './types';
import {ItemEditor_DefaultFilter, Props_Filter} from './defaults/ItemEditor_DefaultFilter';
import {ApiCallerEventType} from '../../core/db-api-gen/types';
import {TS_Icons} from '@thunder-storm/styles';
import {ModuleFE_MouseInteractivity, mouseInteractivity_PopUp, openContent} from '../../component-modules/mouse-interactivity';
import {TS_ButtonLoader} from '../TS_ButtonLoader';
import {_className} from '../../utils/tools';
import {InferProps, InferState} from '../../utils/types';
import {ProtoComponent, ProtoComponentDef, SuperProto} from '../../core/proto-component';
import {Props_EditableItemControllerProto} from '../TS_EditableItemControllerProto';
import {ModuleFE_BrowserHistoryV2} from '../../modules/ModuleFE_BrowserHistoryV2';


export type MenuAction<Proto extends DBProto<any>> = {
	label: string,
	action: (state: State_ItemsEditor<Proto>) => Promise<any>
}
export type State_ItemsEditor<Proto extends DBProto<any>> = {
	editable: EditableItem<Proto['uiType']>,
	filter: ItemEditor_FilterType<Proto>,
	actionInProgress?: number
};
export type Props_ItemsEditor<Proto extends DBProto<any>> = {
	ListRenderer?: React.ComponentType<Props_ListRenderer<Proto>>
	EditorRenderer: React.ComponentType<Partial<Props_EditableItemControllerProto<Proto>>>,
	Filter?: React.ComponentType<Props_Filter<Proto>>
	module: ModuleFE_BaseApi<Proto>,
	route: TS_Route<{ _id: string }>,
	sort: ItemEditor_SortType<Proto>,
	mapper: ItemEditor_MapperType<Proto>
	itemRenderer: (item: Proto['uiType']) => JSX.Element,
	actions: MenuAction<Proto>[]
	id?: string,
	contextMenuActions: MenuAction<Proto>[]
	hideAddItem: boolean
};

/**
 * Manages a list of items on the left with a selected item, and an editor on the right
 */
export type ProtoDef_Selection = ProtoComponentDef<'selected', {
	selected: { [dbKey: string]: UniqueId }
}>

export abstract class Page_ItemsEditor<Proto extends DBProto<any>,
	CProto extends SuperProto<ProtoDef_Selection, ProtoComponentDef<string, any>> = ProtoDef_Selection,
	P = {}, S = {}>
	extends ProtoComponent<CProto, Props_ItemsEditor<Proto> & P, State_ItemsEditor<Proto> & S> {

	static _defaultProps: ProtoDef_Selection['props'] = {
		keys: ['selected']
	};

	constructor(p: InferProps<Page_ItemsEditor<Proto, CProto, P, S>>) {
		super(p);
	}

	componentDidMount() {
		const selectedId = this.getQueryParam('selected', {} as CProto['queryParamDef']['selected'])[this.props.module.dbDef.dbKey];
		if (!selectedId)
			this.onSelected(sortArray(this.props.module.cache.allMutable(), this.props.sort)[0]);
	}

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		if (nextProps === this.props || nextProps.module !== this.props.module) {
			// @ts-ignore
			delete this[this.props.module.defaultDispatcher.method];
			// @ts-ignore
			this[nextProps.module.defaultDispatcher.method] = (...args: any[]) => this.__onItemUpdated(...args);
		}

		const selectedId = this.getQueryParam('selected', {} as CProto['queryParamDef']['selected']) [this.props.module.dbDef.dbKey];
		if (!exists(selectedId)) {
			state.editable = this.createEditableItem({} as Proto['uiType']);
			return state;
		}

		const item = this.props.module.cache.unique(selectedId as string);
		if (!exists(item)) {
			this.logError(`Could not find item ${this.props.module.dbDef.dbKey} with id ${selectedId}`);
			this.onSelected();
			return state;
		}

		state.editable = this.createEditableItem(item);
		state.filter ??= () => true;
		return state;
	}

	private __onItemUpdated = (...params: ApiCallerEventType<Proto>): void => {
		const items = asArray(params[1]);
		if (!items.map(dbObjectToId).includes(this.state.editable.get('_id') as string))
			return this.onSelected(items[0]);

		if (params[0] === 'delete' || params[0] === 'delete-multi')
			return this.onSelected();

		return this.reDeriveState();
	};

	private createEditableItem(item: Partial<Proto['uiType']>) {
		return new EditableDBItemV3<Proto>({...item}, this.props.module, this.onSelected.bind(this)).setAutoSave(true);
	}

	render() {
		const List = this.props.ListRenderer || ItemEditor_DefaultList;
		const Filter: Props_ItemsEditor<Proto>['Filter'] = this.props.Filter || ItemEditor_DefaultFilter;
		const Editor: Props_ItemsEditor<Proto>['EditorRenderer'] = this.props.EditorRenderer;
		const sort = this.props.sort || ((item: DB_Object) => item.__created);
		return <FrameLayout id={this.props.id} className="editor-page">
			<LL_H_T className="editor-content match_parent">
				<LL_V_L className="items-editor__list">
					<LL_V_L className={'items-editor__list-header-content'}>
						<div className={'items-editor__list-header'}>
							{this.renderHeader()}
						</div>
						<Filter
							onFilterChanged={filter => this.setState({filter} as InferState<this>)}
							mapper={this.props.mapper}
						/>
						{this.renderMenuIcon()}
					</LL_V_L>
					<List
						contextMenuItems={this.props.contextMenuActions}
						itemRenderer={this.props.itemRenderer}
						filter={this.state.filter}
						selected={this.state.editable?.item}
						sort={sort}
						module={this.props.module}
						onSelected={this.onSelected.bind(this)}/>
					{this.renderAddNewItem()}
				</LL_V_L>
				<div className="item-editor"><Editor item={this.state.editable?.item}/></div>
			</LL_H_T>
		</FrameLayout>;
	}

	protected renderHeader(): React.ReactNode {
		return '';
	}

	protected renderAddNewItem() {
		if (this.props.hideAddItem)
			return '';

		return <Component_AddNewItem
			entity={this.renderHeader()}
			onCreateNewItem={async () => this.onSelected({} as Partial<Proto['uiType']>)}/>;
	}

	static refactoring_setSelected<Proto extends DBProto<any>>(module: ModuleFE_BaseApi<Proto>, id?: string) {
		const selected = (ModuleFE_BrowserHistoryV2.get('selected') ?? {}) as { [dbKey: string]: UniqueId };

		const selectedId = id;
		if (!selectedId)
			delete selected[module.dbDef.dbKey];
		else
			selected[module.dbDef.dbKey] = selectedId;

		ModuleFE_BrowserHistoryV2.set('selected', selected);
	}

	private onSelected(item?: Partial<Proto['uiType']>) {
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

		return <TS_Icons.more.component
			className={'editor--menu-icon'}
			{...openContent.popUp.bottom('editor--menu', this.renderMenu, 10)}
		/>;
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
				return <div
					key={action.label}
					className={className}
					onClick={async () => {
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

export const Component_AddNewItem = (props: { onCreateNewItem: () => Promise<any>, entity: React.ReactNode }) => {
	return <LL_H_C
		className="add-item-v3 clickable"
		onClick={props.onCreateNewItem}>Add new {props.entity}</LL_H_C>;
};
