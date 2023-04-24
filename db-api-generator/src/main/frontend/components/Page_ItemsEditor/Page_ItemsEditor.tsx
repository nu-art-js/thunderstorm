import * as React from 'react';
import {_className, getQueryParameter, LL_H_T, LL_V_L, ModuleFE_RoutingV2, TS_Input, TS_Route, TS_Space} from '@nu-art/thunderstorm/frontend';
import {DB_Object, Filter} from '@nu-art/ts-common';
import './Page_ItemsEditor.scss';
import {BaseDB_ApiCaller} from '../../modules/BaseDB_ApiCaller';
import {BaseDB_ApiCallerV2} from '../../modules/BaseDB_ApiCallerV2';
import {Props_SmartComponent, State_SmartComponent} from '../SmartComponent';
import {EditableDBItem} from '../../utils/EditableDBItem';
import {Props_SmartPage, SmartPage} from '../SmartPage';


type ApiCaller<T extends DB_Object, Ks extends keyof T = '_id'> = BaseDB_ApiCaller<T, Ks> | BaseDB_ApiCallerV2<T, Ks>;

export type State_ItemsEditor<DBItem extends DB_Object> = State_SmartComponent & { editable: EditableDBItem<DBItem> };
export type Props_ItemsEditor<DBItem extends DB_Object> = Props_SmartPage<State_ItemsEditor<DBItem>> & {
	ListRenderer?: React.ComponentType<Props_ListRenderer<DBItem>>
	EditorRenderer: React.ComponentType<{ editable: EditableDBItem<DBItem> }>
	module: ApiCaller<DBItem, '_id'>,
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
		const selectedId = getQueryParameter('_id') as string;
		if (selectedId) {
			const item = this.props.module.cache.unique(selectedId)!;
			const newVar = () => {
				this.reDeriveState({editable: this.state.editable.clone()} as State_ItemsEditor<DBItem>);
			};

			state.editable = new EditableDBItem<DBItem>({...item}, this.props.module, newVar);
		}
		return state;
	}

	render() {
		const List = this.props.ListRenderer || DefaultListRenderer;
		const Editor = this.props.EditorRenderer;
		const sort = this.props.sort || ((item: DB_Object) => item.__created);
		return <LL_H_T className="editor-page match_parent margin__block">
			<List
				itemRenderer={this.props.itemRenderer}
				filter={this.props.filter}
				selected={this.state.editable?.item}
				sort={sort}
				module={this.props.module}
				onSelected={this.onSelected}/>
			<TS_Space width={1}/>
			{this.state.editable && <div className="item-editor"><Editor editable={this.state.editable}/></div>}
		</LL_H_T>;
	}

	private onSelected = (item: Readonly<DBItem>) => {
		ModuleFE_RoutingV2.goToRoute(this.props.route, {_id: item._id});
		this.reDeriveState();
	};
}

export type Props_ListRenderer<DBItem extends DB_Object> = {
	module: ApiCaller<DBItem, '_id'>,
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
			<TS_Input className={'margin__bottom'} placeholder={'Type to Filter'} type={'text'} onChange={value => this.setState({filterText: value})}/>
			<LL_V_L className="flex__grow scrollable-y match_width">
				{items.map(item => <div key={item._id}
																className={_className('match_width', 'list-item', item._id === this.props.selected?._id && 'list-item__selected')}
																onClick={() => this.props.onSelected(item)}>{this.props.itemRenderer(item)}</div>)}
			</LL_V_L>
		</LL_V_L>;
	}
}