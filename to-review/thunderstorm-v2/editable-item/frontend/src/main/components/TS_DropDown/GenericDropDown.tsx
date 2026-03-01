import {DB_Object, Filter, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {CSSProperties} from 'react';
import {Adapter, ComponentSync, SimpleListAdapter, TS_DropDown} from '@nu-art/thunder-widgets';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {DB_Prototype} from '@nu-art/db-api-shared';
import type {ComponentProps_Error} from '../../editables/resolve-editable-error.js';

type Props_CanUnselect<T> = ({ canUnselect: true; onSelected: (selected?: T) => void } | {
	canUnselect?: false;
	onSelected: (selected: T) => void
})

type BaseInfraProps_TS_GenericDropDown<T> = ComponentProps_Error & {
	dropdownRef?: React.RefObject<any>
	className?: string
	style?: CSSProperties
	placeholder?: string;
	mapper?: (item: T) => (string | undefined)[]
	noOptionsRenderer?: React.ReactNode | ((filter?: string) => React.ReactNode);
	renderer?: (item: T) => React.ReactElement
	ifNoneShowAll?: boolean
	caret?: { open: React.ReactNode, close: React.ReactNode }
	onNoMatchingSelectionForString?: (filterText: string, matchingItems: T[], e: React.KeyboardEvent) => any;
	limitItems?: number;
	hidePlaceholderOnOpen?: boolean;
	itemResolver?: () => T[]
	innerRef?: React.RefObject<any>;
	tabIndex?: number;
	unselectLabel?: string
	id?: string
	queryFilter?: (item: T) => boolean
	sortBy?: ((keyof T) | ((item: T) => string | number))[];
}

type BaseAppLevelProps_TS_GenericDropDown<T> = BaseInfraProps_TS_GenericDropDown<T> & {
	inputValue?: string;
	boundingParentSelector?: string;
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
	limitItems?: number;
	disabled?: boolean
}

export type AppLevelProps_TS_GenericDropDown<T> = Props_CanUnselect<T> & BaseAppLevelProps_TS_GenericDropDown<T> & {
	selected?: T | string | (() => T | undefined);
}

export type TemplatingProps_TS_GenericDropDown<Database extends DB_Prototype<any>, T extends Database['dbType'] = Database['dbType']> =
	BaseInfraProps_TS_GenericDropDown<T> & {
	placeholder: string;
	module: ModuleFE_BaseApi<Database>;
	modules: ModuleFE_BaseApi<Database>[];
	mapper: (item: T) => (string | undefined)[]
	renderer: (item: T) => React.ReactElement
	selectedItemRenderer?: (selected: T) => React.ReactNode
}

export type GenericDropDown_DBPointer_Item<Database extends DB_Prototype<any>> = { dbKey: Database['dbKey'], item: Database['dbType'] };
export type TemplatingProps_TS_GenericDropDown_DBPointer<Database extends DB_Prototype<any>, T extends GenericDropDown_DBPointer_Item<Database> = GenericDropDown_DBPointer_Item<Database>> =
	Omit<BaseInfraProps_TS_GenericDropDown<T>, 'mapper'>
	& {
	placeholder: string;
	selectedItemRenderer?: (selected: T) => React.ReactNode
	pointerProps: {
		[P in Database as P['dbKey']]: {
			module: ModuleFE_BaseApi<P>;
			mapper: (item: GenericDropDown_DBPointer_Item<P>) => string[];
			renderer: (item: GenericDropDown_DBPointer_Item<P>) => React.ReactElement;
		}
	}
}

type Props_TS_GenericDropDown<Database extends DB_Prototype<any>, T extends Database['dbType'] = Database['dbType']> =
	TemplatingProps_TS_GenericDropDown<T> &
	BaseAppLevelProps_TS_GenericDropDown<T> &
	Props_CanUnselect<T> & {
	selected?: Database['dbType'] | string | (() => Database['dbType'] | undefined);
}

type State<T extends DB_Object> = ComponentProps_Error & {
	items: T[]
	selected?: T
	filter: Filter<T>;
	adapter: Adapter<T>;
}

// const defaultQueryFilter = () => true;

export class GenericDropDown<Database extends DB_Prototype<any>, T extends Database['dbType'] = Database['dbType']>
	extends ComponentSync<Props_TS_GenericDropDown<Database>, State<T>> {

	protected deriveStateFromProps(nextProps: Props_TS_GenericDropDown<Database>): State<T> {
		const state = {} as State<T>;
		const items = this.props.itemResolver?.() ?? nextProps.module.cache.allMutable() ?? [];

		if (!nextProps.queryFilter)
			state.items = items;
		else {
			state.items = items.filter(nextProps.queryFilter);
			if (state.items.length === 0 && nextProps.ifNoneShowAll === true)
				state.items = items;
		}

		//Sort Items by sort function or object keys
		state.items = nextProps.sortBy?.reduce(
			(toRet: T[], sortByKey: ((keyof T) | ((item: T) => string | number))) =>
				sortArray(toRet, typeof sortByKey === 'function' ? sortByKey : (item: T) => item[sortByKey]),
			state.items
		) ?? state.items;

		state.error = nextProps.error;
		//Set selected item
		state.selected = this.getSelected(nextProps.module, nextProps.selected);
		state.filter = new Filter<T>(nextProps.mapper);
		state.adapter = SimpleListAdapter(state.items, props => nextProps.renderer(props.item));
		return state;
	}

	private getSelected(module: ModuleFE_BaseApi<Database>, selectMethod?: Database['dbType'] | string | (() => (Database['dbType'])) | undefined) {
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
			ref={this.props.dropdownRef} // allow interacting with the TS_Input interface itself and not the html element inside
			id={this.props.id}
			innerRef={this.props.innerRef}
			tabIndex={this.props.tabIndex}
			error={this.state.error}
			className={this.props.className}
			placeholder={this.props.placeholder || 'Choose one'}
			inputValue={this.props.inputValue}
			adapter={this.state.adapter}
			filter={this.state.filter}
			selected={this.state.selected}
			onNoMatchingSelectionForString={this.props.onNoMatchingSelectionForString}
			onSelected={this.props.onSelected}
			noOptionsRenderer={this.props.noOptionsRenderer}
			caret={this.props.caret}
			selectedItemRenderer={this.props.selectedItemRenderer}
			boundingParentSelector={this.props.boundingParentSelector}
			renderSearch={this.props.renderSearch}
			limitItems={this.props.limitItems}
			hidePlaceholderOnOpen={this.props.hidePlaceholderOnOpen}
			unselectLabel={this.props.unselectLabel}
			canUnselect={this.props.canUnselect as (typeof this.props.canUnselect extends true ? true : false | undefined)}
			disabled={this.props.disabled}
		/>;
	}
}
