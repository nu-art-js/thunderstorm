import {Component_SearchAddOn} from '../../components/Component_SearchAddOn.js';
import {AddOn_EntityFilter, AddOnDef_EntityFilter} from './types.js';
import {InferProps, InferState, LL_H_C, SimpleListAdapter, TS_DropDown, TS_PropRenderer} from '@nu-art/thunderstorm-frontend';
import {TS_Icons} from '@nu-art/ts-styles';
import './Component_AddOn_EntityFilter.scss';
import {SearchAddOn, SearchItem} from '../../../_core/index.js';

type Props = { label?: string };

type State = {
	label: string;
	activeSearchItems: SearchItem<any, any>[];
}

export class Component_AddOn_EntityFilter
	extends Component_SearchAddOn<AddOnDef_EntityFilter, Props, State> {

	public addOn: SearchAddOn<AddOnDef_EntityFilter> = AddOn_EntityFilter;

	
	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state.label = nextProps.label ?? 'By Entity';
		state.activeSearchItems = nextProps.context.getActiveSearchItems();
		return state;
	}

	
	private onItemSelected = (searchItem: SearchItem<any, any>) => {
		const items = this.state.value ? [...this.state.value] : [];
		items.push(searchItem.module.dbDef.dbKey);
		this.setValue(items);
	};

	private onItemRemoved = (searchItem: SearchItem<any, any>) => {
		const items = (this.state.value ?? []).filter(item => item !== searchItem.module.dbDef.dbKey);
		this.setValue(items);
	};

	
	render() {
		if (!this.state.activeSearchItems)
			return;

		return <TS_PropRenderer.Vertical label={this.state.label} className={'search-add-on__entity-filter'}>
			<LL_H_C className={'search-add-on__entity-filter__item-list'}>
				{this.state.value?.map(this.render_SelectedItem)}
				{this.render_ItemSelector()}
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	}

	private render_SelectedItem = (itemKey: string) => {
		const searchItem = this.state.activeSearchItems.find(item => item.module.dbDef.dbKey === itemKey);
		if (!searchItem)
			return void this.logWarning(`Could not find a search item for key ${itemKey}`);

		return <LL_H_C
			key={searchItem.module.dbDef.dbKey}
			className={'search-add-on__entity-filter__selected-item'}
		>
			{searchItem.entityLabel}
			<TS_Icons.x.component onClick={() => this.onItemRemoved(searchItem)}/>
		</LL_H_C>;
	};

	private render_ItemSelector = () => {
		const adapter = SimpleListAdapter(this.state.activeSearchItems, item => <>{item.item.entityLabel}</>);
		return <TS_DropDown
			adapter={adapter}
			selected={undefined}
			onSelected={this.onItemSelected}
			placeholder={'Select an entity'}
			queryFilter={item => !this.state.value?.includes(item.module.dbDef.dbKey)}
		/>;
	};
}