import * as React from 'react';
import {DB_Object, Filter} from '@nu-art/ts-common';
import {EditableDBItem} from '../../utils/EditableDBItem';
import './Page_ItemsEditor.scss';
import {FrameLayout} from '../FrameLayout';
import {Props_SmartComponent, State_SmartComponent} from '../../core/SmartComponent';
import {Props_SmartPage, SmartPage} from '../../core/SmartPage';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {getQueryParameter, ModuleFE_RoutingV2, TS_Route} from '../../modules';
import {LL_H_T, LL_V_L, LL_VH_C} from '../Layouts';
import {TS_Space} from '../TS_Space';
import {TS_Input} from '../TS_Input';
import {_className} from '../../utils/tools';


export type State_ItemsEditor<DBItem extends DB_Object> = State_SmartComponent & { editable: EditableDBItem<DBItem> };
export type Props_ItemsEditor<DBItem extends DB_Object> = Props_SmartPage<State_ItemsEditor<DBItem>> & {
	ListRenderer?: React.ComponentType<Props_ListRenderer<DBItem>>
	EditorRenderer: React.ComponentType<{ editable: EditableDBItem<DBItem> }>
	module: ModuleFE_BaseApi<DBItem>,
	route: TS_Route<{ _id: string }>,
	sort: (item: DBItem) => string | number,
	filter: Filter<DBItem>
	itemRenderer: (item: DBItem) => JSX.Element,
};

export class Page_ItemsEditor<DBItem extends DB_Object>
	extends SmartPage<Props_ItemsEditor<DBItem>, State_ItemsEditor<DBItem>> {

	constructor(p: Props_ItemsEditor<DBItem>) {
		super(p);
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent, state: State_ItemsEditor<DBItem>): Promise<State_ItemsEditor<DBItem>> {
		const selectedId = getQueryParameter('_id');
		this.logError(selectedId);
		if (selectedId === undefined)
			return state;

		if (selectedId === null)
			state.editable = this.createEditableItem({});
		else if (selectedId) {
			const item = this.props.module.cache.unique(selectedId as string)!;
			state.editable = this.createEditableItem(item);
		}

		return state;
	}

	private createEditableItem(item: Partial<DBItem>) {
		return new EditableDBItem<DBItem>({...item}, this.props.module, this.onSelected).setAutoSave(true);
	}

	render() {
		const List = this.props.ListRenderer || DefaultListRenderer;
		const Editor = this.props.EditorRenderer;
		const sort = this.props.sort || ((item: DB_Object) => item.__created);
		return <FrameLayout className="editor-page">
			<LL_H_T className="editor-content match_parent margin__block">
				<List
					itemRenderer={this.props.itemRenderer}
					filter={this.props.filter}
					selected={this.state.editable?.item}
					sort={sort}
					module={this.props.module}
					onSelected={this.onSelected}/>
				<TS_Space width={1}/>
				{this.state.editable && <div className="item-editor"><Editor editable={this.state.editable}/></div>}
			</LL_H_T>
			<LL_VH_C className="add-item clickable" onClick={() => {
				this.onSelected({});
			}}>+</LL_VH_C>
		</FrameLayout>;
	}

	private onSelected = (item: Partial<DBItem>) => {
		ModuleFE_RoutingV2.goToRoute(this.props.route, {_id: item._id});
		this.reDeriveState();
	};
}

export type Props_ListRenderer<DBItem extends DB_Object> = {
	module: ModuleFE_BaseApi<DBItem>,
	selected?: Partial<DBItem>
	filter: Filter<DBItem>,
	onSelected: (item: DBItem) => void
	sort: (item: DBItem) => string | number,
	itemRenderer: (item: DBItem) => JSX.Element,
};

export class DefaultListRenderer<DBItem extends DB_Object>
	extends React.Component<Props_ListRenderer<DBItem>, { filterText: string }> {
	state = {filterText: ''};

	render() {
		const items = this.props.filter.filterSort(this.props.module.cache
			.sort(this.props.sort), this.state.filterText);

		return <LL_V_L className="items-list match_height margin__inline">
			<TS_Input className={'margin__bottom'} placeholder={'Type to Filter'} type={'text'}
					  onChange={value => this.setState({filterText: value})}/>
			<LL_V_L className="flex__grow scrollable-y match_width">
				{items.map(item => <div key={item._id}
										className={_className('match_width', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')}
										onClick={() => this.props.onSelected(item)}>{this.props.itemRenderer(item)}</div>)}
			</LL_V_L>
		</LL_V_L>;
	}
}