import * as React from 'react';
import {_className, ComponentSync, EditableDBItemV3, LL_H_C, LL_V_L, ModuleFE_v3_BaseApi, TS_Button, TS_Input} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, DBProto, Filter, sortArray, UniqueId} from '@nu-art/ts-common';
import './editor-base.scss';
import {TS_Icons} from '@nu-art/ts-styles';

const newItemIdentifier = '##new-item##';

export type State_EditorBase<T extends DBProto<any>> = {
	items: Readonly<T['dbType'][]>;
	selectedItemId?: UniqueId | typeof newItemIdentifier;
	editedItem?: EditableDBItemV3<T>;
	listFilter?: string;
};

export type Props_EditorBase<T extends DBProto<any>> = {
	module: ModuleFE_v3_BaseApi<T>;
	itemName: string;
	itemNamePlural: string;
	itemDisplay: (item: T['dbType']) => string;
}

export abstract class EditorBase<T extends DBProto<any>, S extends State_EditorBase<T> = State_EditorBase<T>, P extends Props_EditorBase<T> = Props_EditorBase<T>>
	extends ComponentSync<P, S> {

	//######################### Lifecycle #########################

	protected deriveStateFromProps(nextProps: P, state: S): S {
		state.items = sortArray([...this.props.module.cache.all()], this.props.itemDisplay);
		if (!state.editedItem && state.items.length) {
			state.editedItem = this.getEditable(state.items[0]);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

	//######################### Logic #########################

	protected getEditable(instance: Partial<T['dbType']>): EditableDBItemV3<T> {
		return new EditableDBItemV3<T>(instance, this.props.module, dbItem => {
			this.setState({editedItem: this.getEditable(dbItem), selectedItemId: dbItem._id});
		})
			.setAutoSave(!!instance._id)
			.setDebounceTimeout(0);
	};

	protected getNewInstance(): Partial<T['dbType']> {
		return {};
	};

	private selectItem = (itemId?: string) => {
		if (!itemId)
			return this.setState({selectedItemId: undefined, editedItem: undefined});

		const item = itemId === newItemIdentifier ? this.getNewInstance() : this.state.items.find(item => item._id === itemId);

		if (!item)
			throw new BadImplementationException(`Could not find item with id ${itemId}`);

		const editable = this.getEditable(item);
		return this.reDeriveState({
			editedItem: editable,
			selectedItemId: item._id
		} as S);
	};
	
	//######################### Render #########################

	render() {
		return <LL_H_C className={'permissions-editor match_parent'}>
			{this.renderList()}
			{this.renderEditor()}
		</LL_H_C>;
	}

	//######################### Render - List #########################

	private renderList = () => {
		return <LL_V_L className={'item-list'}>
			<div className={'item-list__header'}>{this.props.itemNamePlural}</div>
			{this.renderListFilter()}
			{this.renderListItems()}
			{this.renderListButton()}
		</LL_V_L>;
	};

	protected renderListFilter = () => {
		return <LL_H_C className={'item-list__filter'}>
			<TS_Input
				type={'text'}
				value={this.state.listFilter}
				onChange={listFilter => this.setState({listFilter})}
			/>
			<TS_Icons.Search.component/>
		</LL_H_C>;
	};

	protected renderListItems = () => {
		let items = [...this.state.items] as T['dbType'][];
		if (this.state.listFilter) {
			const filter = new Filter<T['dbType']>(i => [this.props.itemDisplay(i)]);
			items = filter.filter(items, this.state.listFilter);
		}
		return <LL_V_L className={'item-list__list'}>
			{items.map(item => {
				const className = _className('item-list__list-item', item._id === this.state.selectedItemId ? 'selected' : undefined);
				return <div className={className} onClick={() => this.selectItem(item._id)}
										key={item._id}>{this.props.itemDisplay(item)}</div>;
			})}
		</LL_V_L>;
	};

	protected renderListButton = () => {
		return <TS_Button className={'item-list__add-button'} onClick={() => this.selectItem(newItemIdentifier)}>
			Add New {this.props.itemName}
		</TS_Button>;
	};

	//######################### Render - Editor #########################

	abstract editorContent: () => React.ReactNode;

	private renderEditor = () => {
		if (!this.state.editedItem)
			return '';

		const item = this.state.editedItem;

		return <LL_V_L className={'item-editor'}>
			<div
				className={'item-editor__header'}>{item.item._id ? this.props.itemDisplay(item.item as T) : `New ${this.props.itemName}`}</div>
			<LL_V_L className={'item-editor__main'}>
				{this.editorContent()}
			</LL_V_L>
		</LL_V_L>;
	};
}