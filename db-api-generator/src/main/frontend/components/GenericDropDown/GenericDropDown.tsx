import {SimpleListAdapter, TS_DropDown} from '@nu-art/thunderstorm/frontend';
import {DB_Object, Filter, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {BaseDB_ApiCaller, Props_SmartComponent, SmartComponent, State_SmartComponent} from '../..';


export type MandatoryProps_GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'> = {
	placeholder: string;
	module: BaseDB_ApiCaller<T, Ks>;
	modules: BaseDB_ApiCaller<DB_Object, any>[];
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
}

export type PartialProps_GenericDropDown<T> = {
	selected?: T | string | (() => Promise<T | undefined>);
	inputValue?: string;
	placeholder?: string;
	onSelected: (selected: T) => void;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => Promise<void> | void;
	mapper?: (item: T) => string[]
	renderer?: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: (keyof T)[] | ((item: T) => string | number);
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	boundingParentSelector?: string;
}

export type Props_GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'> = {
	selected?: T | string | (() => Promise<T | undefined>);
	placeholder?: string;
	inputValue?: string;
	onSelected: (selected: T) => void;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => Promise<void> | void;
	module: BaseDB_ApiCaller<T, Ks>;
	modules: BaseDB_ApiCaller<DB_Object, any>[];
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: (keyof T)[] | ((item: T) => string | number);
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	boundingParentSelector?: string;
}

type State<T extends DB_Object> = {
	items: T[]
	selected?: T
}

// const defaultQueryFilter = () => true;

export class GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'>
	extends SmartComponent<Props_GenericDropDown<T, Ks>, State<T>> {

	constructor(props: Props_GenericDropDown<T, Ks>) {
		super(props);
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent & Props_GenericDropDown<T, Ks>, state: (State<T> & State_SmartComponent)) {
		//If filter exists, get filtered items
		if (nextProps.queryFilter)
			state.items = await nextProps.module.cache.filter(nextProps.queryFilter);

		//If filter doesn't exist OR (filter gave 0 results AND ifNoneShowAll condition flagged true)
		if (!nextProps.queryFilter || (state.items.length === 0 && nextProps.ifNoneShowAll === true))
			state.items = await nextProps.module.cache.query();

		//Sort Items by sort function or object keys
		if (typeof nextProps.sortBy === 'function')
			state.items = sortArray(state.items, nextProps.sortBy);
		else
			state.items = nextProps.sortBy?.reduce((toRet, sortKey) => {
				return sortArray(toRet, item => item[sortKey]);
			}, state.items) || state.items;

		//Set selected item
		const selectedItem = nextProps.selected;
		switch (typeof selectedItem) {
			case 'object':
				if (!Array.isArray(selectedItem)) {
					state.selected = selectedItem;
					break;
				}
				break;

			case 'string':
				state.selected = await nextProps.module.cache.unique(selectedItem);
				break;

			case 'function':
				state.selected = await selectedItem();
				break;

			case 'undefined':
				state.selected = undefined;
		}
		return state;
	}

	_render() {
		const filter = new Filter<T>(this.props.mapper);
		const adapter = SimpleListAdapter(this.state.items, props => this.props.renderer(props.item));

		return <TS_DropDown<T>
			className={this.props.className}
			placeholder={this.props.placeholder || 'Choose one'}
			inputValue={this.props.inputValue}
			adapter={adapter}
			filter={filter}
			selected={this.state.selected}
			onNoMatchingSelectionForString={this.props.onNoMatchingSelectionForString}
			onSelected={this.props.onSelected}
			caret={this.props.caret}
			boundingParentSelector={this.props.boundingParentSelector}
		/>;
	}
}