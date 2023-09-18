import {DB_Object, Default_UniqueKey, Filter, PreDB, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {TS_DropDown} from '../TS_Dropdown';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {Adapter, SimpleListAdapter} from '../adapter/Adapter';
import {ComponentSync} from '../../core';


type OptionalCanUnselect<T> = {
	selected?: T | string | (() => T | undefined);
} & ({ canUnselect: true; onSelected: (selected?: T) => void } | { canUnselect?: false; onSelected: (selected: T) => void })

export type OptionalProps_GenericDropDown<T> = {
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

export type BasePartialProps_GenericDropDown<T> = OptionalProps_GenericDropDown<T> & {
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;
	boundingParentSelector?: string;
	inputValue?: string;
	limitItems?: number;
	itemResolver?: () => T[]
}

export type PartialProps_GenericDropDown<T> = BasePartialProps_GenericDropDown<T> & OptionalCanUnselect<T>

export type MandatoryProps_GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> =
	OptionalProps_GenericDropDown<T>
	& {
	placeholder: string;
	module: ModuleFE_BaseApi<T, Ks>;
	modules: ModuleFE_BaseApi<DB_Object, any>[];
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
}

type GenericDropDownProps<T, Ks> = {
	placeholder?: string;
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: ((keyof T) | ((item: T) => string | number))[];
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;

	selected?: T | string | (() => T | undefined);
	inputValue?: string;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;

	modules: ModuleFE_BaseApi<DB_Object, any>[];
	boundingParentSelector?: string;
	limitItems?: number;
	disabled?: boolean;
	itemResolver?: () => T[]
} & OptionalCanUnselect<T>

export type Props_GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey> =
	{ module: ModuleFE_BaseApi<T, Ks>; }
	& GenericDropDownProps<T, Ks>

type State<T extends DB_Object> = {
	items: T[]
	selected?: T
	filter: Filter<T>;
	adapter: Adapter<T>;
}

// const defaultQueryFilter = () => true;

export class GenericDropDown<T extends DB_Object, Ks extends keyof PreDB<T> = Default_UniqueKey>
	extends ComponentSync<Props_GenericDropDown<T, Ks>, State<T>> {

	protected deriveStateFromProps(nextProps: Props_GenericDropDown<T, Ks>): State<T> {
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

	private getSelected(module: ModuleFE_BaseApi<T, Ks>, selectMethod?: T | string | (() => T | undefined)) {
		switch (typeof selectMethod) {
			case 'string':
				return module.cache.unique(selectMethod);
			case 'function':
				return selectMethod();
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