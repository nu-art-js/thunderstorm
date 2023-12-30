import * as React from 'react';
import {asArray, DB_Object, dbObjectToId, DBProto} from '@nu-art/ts-common';
import {FrameLayout} from '../FrameLayout';
import {ModuleFE_RoutingV2, TS_Route} from '../../modules/routing';
import {LL_H_T, LL_V_L, LL_VH_C} from '../Layouts';
import {getQueryParameter} from '../../modules/ModuleFE_BrowserHistory';
import './Page_ItemsEditorV3.scss';
import {ModuleFE_v3_BaseApi} from '../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {EditableDBItemV3, EditableItem} from '../../utils/EditableItem';
import {EditableRef} from '../TS_EditableItemComponent/TS_EditableItemComponent';
import {ItemEditor_DefaultList, Props_ListRendererV3} from './defaults/ItemEditor_ListRenderer';
import {ItemEditor_FilterType, ItemEditor_MapperType, ItemEditor_SortType} from './types';
import {ItemEditor_DefaultFilter, Props_Filter} from './defaults/ItemEditor_DefaultFilter';
import {ApiCallerEventTypeV3} from '../../core/db-api-gen/v3_types';
import {ComponentSync} from '../../core/ComponentSync';


type State_ItemsEditorV3<Proto extends DBProto<any>> = { editable: EditableItem<Proto['uiType']>, filter: ItemEditor_FilterType<Proto> };
export type Props_ItemsEditorV3<Proto extends DBProto<any>> = {
	ListRenderer?: React.ComponentType<Props_ListRendererV3<Proto>>
	EditorRenderer: React.ComponentType<EditableRef<Proto['uiType']>>
	Filter: React.ComponentType<Props_Filter<Proto>>
	module: ModuleFE_v3_BaseApi<Proto>,
	route: TS_Route<{ _id: string }>,
	sort: ItemEditor_SortType<Proto>,
	mapper: ItemEditor_MapperType<Proto>
	itemRenderer: (item: Proto['uiType']) => JSX.Element,
};

export class Page_ItemsEditorV3<Proto extends DBProto<any>>
	extends ComponentSync<Props_ItemsEditorV3<Proto>, State_ItemsEditorV3<Proto>> {

	constructor(p: Props_ItemsEditorV3<Proto>) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_ItemsEditorV3<Proto>, state: State_ItemsEditorV3<Proto>) {
		if (nextProps === this.props || nextProps.module !== this.props.module) {
			// @ts-ignore
			delete this[this.props.module.defaultDispatcher.method];
			// @ts-ignore
			this[nextProps.module.defaultDispatcher.method] = (...args: any[]) => this.__onItemUpdated(...args);
		}

		const selectedId = getQueryParameter('_id');
		if (selectedId === undefined)
			return state;

		if (selectedId === null)
			state.editable = this.createEditableItem({});
		else if (selectedId) {
			const item = this.props.module.cache.unique(selectedId as string)!;
			state.editable = this.createEditableItem(item);
		}
		state.filter ??= (item: Proto['uiType']) => true;
		return state;
	}

	private __onItemUpdated = (...params: ApiCallerEventTypeV3<Proto>): void => {
		const items = asArray(params[1]);
		if (!items.map(dbObjectToId).includes(this.state.editable.get('_id') as string))
			return;

		return this.reDeriveState();
	};

	private createEditableItem(item: Partial<Proto>) {
		return new EditableDBItemV3<Proto>({...item}, this.props.module, this.onSelected).setAutoSave(true);
	}

	render() {
		const List = this.props.ListRenderer || ItemEditor_DefaultList;
		const Filter = this.props.Filter || ItemEditor_DefaultFilter;
		const Editor = this.props.EditorRenderer;
		const sort = this.props.sort || ((item: DB_Object) => item.__created);
		return <FrameLayout className="editor-page">
			<LL_H_T className="editor-content match_parent margin__block">
				{this.renderHeader()}
				<LL_V_L className="match_height">
					<Filter
						onFilterChanged={filter => this.setState({filter})}
						mapper={this.props.mapper}
					/>
					<List
						itemRenderer={this.props.itemRenderer}
						filter={this.state.filter}
						selected={this.state.editable?.item}
						sort={sort}
						module={this.props.module}
						onSelected={this.onSelected}/>
				</LL_V_L>
				<div className="separator"/>
				{this.state.editable && <div className="item-editor"><Editor editable={this.state.editable}/></div>}
			</LL_H_T>
			{this.renderAddNewItem()}
		</FrameLayout>;
	}

	protected renderHeader(): React.ReactNode {
		return '';
	}

	protected renderAddNewItem() {
		return <Component_AddNewItem onCreateNewItem={async () => this.onSelected({} as Partial<Proto['uiType']>)}/>;
	}

	private onSelected = (item: Partial<Proto['uiType']>) => {
		ModuleFE_RoutingV2.goToRoute(this.props.route, {_id: item._id});
		this.reDeriveState();
	};
}

export const Component_AddNewItem = (props: { onCreateNewItem: () => Promise<any> }) => {
	return <LL_VH_C
		className="add-item clickable"
		onClick={props.onCreateNewItem}>+</LL_VH_C>;
};