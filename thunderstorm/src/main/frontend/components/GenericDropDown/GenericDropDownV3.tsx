import {DB_Object, DBProto, Filter, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {TS_DropDown} from '../TS_Dropdown';
import {ModuleFE_v3_BaseApi} from '../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {Adapter, SimpleListAdapter} from '../adapter/Adapter';
import {ComponentSync} from '../../core';


type OptionalCanUnselect<T> = ({ canUnselect: true; onSelected: (selected?: T) => void } | { canUnselect?: false; onSelected: (selected: T) => void })

type OptionalProps_GenericDropDownV3<T> = {
	placeholder?: string;
	mapper?: (item: T) => string[]
	renderer?: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: ((keyof T) | ((item: T) => string | number))[];
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
	limitItems?: number;
	noOptionsRenderer?: React.ReactNode | (() => React.ReactNode);
	disabled?: boolean;
}

export type PartialProps_GenericDropDownV3<T> = OptionalProps_GenericDropDownV3<T> & {
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;
	boundingParentSelector?: string;
	inputValue?: string;
	selected?: T | string | (() => T | undefined);
	limitItems?: number;
	itemResolver?: () => T[]
} & OptionalCanUnselect<T>

export type MandatoryProps_GenericDropDownV3<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']> =
	OptionalProps_GenericDropDownV3<T>
	& {
	placeholder: string;
	module: ModuleFE_v3_BaseApi<Proto>;
	modules: ModuleFE_v3_BaseApi<Proto>[];
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
}

type GenericDropDownV3Props<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']> = {
	placeholder?: string;
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: ((keyof T) | ((item: T) => string | number))[];
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;

	selected?: Proto['dbType'] | string | (() => Proto['dbType'] | undefined);
	inputValue?: string;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;

	modules: ModuleFE_v3_BaseApi<Proto>[];
	boundingParentSelector?: string;
	limitItems?: number;
	disabled?: boolean;
	itemResolver?: () => T[]
} & OptionalCanUnselect<T>

export type Props_GenericDropDownV3<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']> =
	{ module: ModuleFE_v3_BaseApi<Proto>; }
	& GenericDropDownV3Props<Proto, T>

type State<T extends DB_Object> = {
	items: T[]
	selected?: T
	filter: Filter<T>;
	adapter: Adapter<T>;
}

// const defaultQueryFilter = () => true;

export class GenericDropDownV3<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']>
	extends ComponentSync<Props_GenericDropDownV3<Proto>, State<T>> {

	protected deriveStateFromProps(nextProps: Props_GenericDropDownV3<Proto>): State<T> {
		const state = {} as State<T>;
		const items = this.props.itemResolver?.() || nextProps.module.cache.allMutable();

		if (!nextProps.queryFilter)
			state.items = items;
		else {
			state.items = items.filter(nextProps.queryFilter);
			if (state.items.length === 0 && nextProps.ifNoneShowAll === true)
				state.items = items;
		}

		//Sort Items by sort function or object keys
		state.items = nextProps.sortBy?.reduce((toRet, sortBy) => {
			return sortArray(state.items, typeof sortBy === 'function' ? sortBy : item => item[sortBy]);
		}, state.items) || state.items;

		//Set selected item
		state.selected = this.getSelected(nextProps.module, nextProps.selected);
		state.filter = new Filter<T>(nextProps.mapper);
		state.adapter = SimpleListAdapter(state.items, props => nextProps.renderer(props.item));
		return state;
	}

	private getSelected(module: ModuleFE_v3_BaseApi<Proto>, selectMethod?: Proto['dbType'] | string | (() => (Proto['dbType'])) | undefined) {
		switch (typeof selectMethod) {
			case 'string':
				return module.cache.unique(selectMethod);
			case 'function':
				return (selectMethod as (() => T))();
			case 'object':
				if (!Array.isArray(selectMethod))
					return selectMethod;
		}
		return undefined;
	}

	render() {
		return <TS_DropDown<T>
			className={this.props.className}
			placeholder={this.props.placeholder || 'Choose one'}
			inputValue={this.props.inputValue}
			adapter={this.state.adapter}
			filter={this.state.filter}
			selected={this.state.selected}
			onNoMatchingSelectionForString={this.props.onNoMatchingSelectionForString}
			onSelected={this.props.onSelected}
			caret={this.props.caret}
			boundingParentSelector={this.props.boundingParentSelector}
			renderSearch={this.props.renderSearch}
			limitItems={this.props.limitItems}
			canUnselect={this.props.canUnselect as (typeof this.props.canUnselect extends true ? true : false | undefined)}
			disabled={this.props.disabled}
		/>;
	}
}