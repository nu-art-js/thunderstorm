import {ComponentSync, SimpleListAdapter, TS_DropDown} from '@nu-art/thunderstorm/frontend';
import {cloneArr, DB_Object, Filter, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {BaseDB_ApiCaller} from '../..';


type OptionalProps_GenericDropDown<T> = {
	placeholder?: string;
	mapper?: (item: T) => string[]
	renderer?: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: (keyof T)[] | ((item: T) => string | number);
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
}

export type PartialProps_GenericDropDown<T> = OptionalProps_GenericDropDown<T> & {
	onSelected: (selected: T) => void;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => Promise<void> | void;
	boundingParentSelector?: string;
	inputValue?: string;
	selected?: T | string | (() => T | undefined);
}

export type MandatoryProps_GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'> = OptionalProps_GenericDropDown<T> & {
	placeholder: string;
	module: BaseDB_ApiCaller<T, Ks>;
	modules: BaseDB_ApiCaller<DB_Object, any>[];
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
}

export type Props_GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'> = {
	placeholder?: string;
	mapper: (item: T) => string[]
	renderer: (item: T) => React.ReactElement
	queryFilter?: (item: T) => boolean
	ifNoneShowAll?: boolean
	sortBy?: (keyof T)[] | ((item: T) => string | number);
	className?: string;
	caret?: { open: React.ReactNode, close: React.ReactNode }
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;

	selected?: T | string | (() => T | undefined);
	inputValue?: string;
	onSelected: (selected: T) => void;
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => Promise<void> | void;
	module: BaseDB_ApiCaller<T, Ks>;
	modules: BaseDB_ApiCaller<DB_Object, any>[];
	boundingParentSelector?: string;
}

type State<T extends DB_Object> = {
	items: T[]
	selected?: T
}

// const defaultQueryFilter = () => true;

export class GenericDropDown<T extends DB_Object, Ks extends keyof T = '_id'>
	extends ComponentSync<Props_GenericDropDown<T, Ks>, State<T>> {

	constructor(props: Props_GenericDropDown<T, Ks>) {
		super(props);
	}

	protected deriveStateFromProps(nextProps: Props_GenericDropDown<T, Ks>): State<T> {
		const state = {} as State<T>;
		//If filter exists, get filtered items
		if (nextProps.queryFilter)
			state.items = nextProps.module.cache.filter(nextProps.queryFilter);

		//If filter doesn't exist OR (filter gave 0 results AND ifNoneShowAll condition flagged true)
		if (!nextProps.queryFilter || (state.items.length === 0 && nextProps.ifNoneShowAll === true))
			state.items = cloneArr(nextProps.module.cache.all() as T[]);

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
				state.selected = nextProps.module.cache.unique(selectedItem);
				break;

			case 'function':
				state.selected = selectedItem();
				break;

			case 'undefined':
				state.selected = undefined;
		}
		return state;
	}

	render() {
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
			renderSearch={this.props.renderSearch}
		/>;
	}
}