import {DB_Object, DBProto, Filter, ResolvableContent, resolveContent, sortArray} from '@nu-art/ts-common';
import * as React from 'react';
import {CSSProperties} from 'react';
import {TS_DropDown} from '../TS_Dropdown';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {Adapter, SimpleListAdapter} from '../adapter/Adapter';
import {ComponentSync} from '../../core/ComponentSync';
import {UIProps_EditableItem} from '../../utils/EditableItem';
import {ComponentProps_Error, resolveEditableError} from '../types';


type Props_CanUnselect<T> = ({ canUnselect: true; onSelected: (selected?: T) => void } | {
	canUnselect?: false;
	onSelected: (selected: T) => void
})

type BaseInfraProps_TS_GenericDropDownV3<T> = ComponentProps_Error & {
	dropdownRef?: React.RefObject<any>
	className?: string
	style?: CSSProperties
	placeholder?: string;
	mapper?: (item: T) => (string | undefined)[]
	noOptionsRenderer?: React.ReactNode | (() => React.ReactNode);
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

type BaseAppLevelProps_TS_GenericDropDownV3<T> = BaseInfraProps_TS_GenericDropDownV3<T> & {
	inputValue?: string;
	boundingParentSelector?: string;
	renderSearch?: (dropDown: TS_DropDown<T>) => React.ReactNode;
	limitItems?: number;
	disabled?: boolean
}

export type AppLevelProps_TS_GenericDropDownV3<T> = Props_CanUnselect<T> & BaseAppLevelProps_TS_GenericDropDownV3<T> & {
	selected?: T | string | (() => T | undefined);
}

type EditableItemProps_GenericDropDownV3<T> =
	BaseAppLevelProps_TS_GenericDropDownV3<T>
	& UIProps_EditableItem<any, any, string>
	& {
	onSelected?: (selected: T | undefined, superOnSelected: (selected?: T) => Promise<void>) => void
	canUnselect?: boolean
}
	& ComponentProps_Error

export type TemplatingProps_TS_GenericDropDown<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']> =
	BaseInfraProps_TS_GenericDropDownV3<T> & {
	placeholder: string;
	module: ModuleFE_BaseApi<Proto>;
	modules: ModuleFE_BaseApi<Proto>[];
	mapper: (item: T) => (string | undefined)[]
	renderer: (item: T) => React.ReactElement
	selectedItemRenderer?: (selected: T) => React.ReactNode
}

type Props_TS_GenericDropDownV3<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']> =
	TemplatingProps_TS_GenericDropDown<T> &
	BaseAppLevelProps_TS_GenericDropDownV3<T> &
	Props_CanUnselect<T> & {
	selected?: Proto['dbType'] | string | (() => Proto['dbType'] | undefined);
}

type State<T extends DB_Object> = ComponentProps_Error & {
	items: T[]
	selected?: T
	filter: Filter<T>;
	adapter: Adapter<T>;
}

// const defaultQueryFilter = () => true;

export class GenericDropDownV3<Proto extends DBProto<any>, T extends Proto['dbType'] = Proto['dbType']>
	extends ComponentSync<Props_TS_GenericDropDownV3<Proto>, State<T>> {
	static readonly prepareEditable = <Proto extends DBProto<any>>(mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown<Proto>>) => {
		return (props: EditableItemProps_GenericDropDownV3<Proto['dbType']>) => {
			const {editable, prop, ...restProps} = props;

			const onSelected = async (item: Proto['dbType']) => {
				await editable.updateObj({[prop]: item._id});
			};

			return <GenericDropDownV3<Proto>
				error={resolveEditableError(props)}
				{...resolveContent(mandatoryProps)}
				{...restProps}
				onSelected={async item => {
					if (props.onSelected)
						return props.onSelected(item, onSelected);

					return onSelected(item);
				}}
				selected={editable.item[prop]}/>;
		};
	};
	static readonly prepareSelectable = <Proto extends DBProto<any>>(mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown<Proto>>) => {
		return (props: AppLevelProps_TS_GenericDropDownV3<Proto['dbType']>) =>
			<GenericDropDownV3<Proto> {...resolveContent(mandatoryProps)} {...props}/>;
	};
	static readonly prepare = <Proto extends DBProto<any>>(mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown<Proto>>) => {
		return {
			editable: this.prepareEditable(mandatoryProps),
			selectable: this.prepareSelectable(mandatoryProps)
		};
	};

	protected deriveStateFromProps(nextProps: Props_TS_GenericDropDownV3<Proto>): State<T> {
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

		state.error = nextProps.error;
		//Set selected item
		state.selected = this.getSelected(nextProps.module, nextProps.selected);
		state.filter = new Filter<T>(nextProps.mapper);
		state.adapter = SimpleListAdapter(state.items, props => nextProps.renderer(props.item));
		return state;
	}

	private getSelected(module: ModuleFE_BaseApi<Proto>, selectMethod?: Proto['dbType'] | string | (() => (Proto['dbType'])) | undefined) {
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