import * as React from 'react';
import {
	_className,
	EditableDBItem,
	genericNotificationAction,
	LL_H_C,
	LL_V_L,
	ModuleFE_BaseApi,
	SmartComponent,
	TS_BusyButton,
	TS_Button
} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, cloneArr, DB_Object, sortArray, ThisShouldNotHappenException, UniqueId} from '@nu-art/ts-common';

import './editor-base.scss';


const newItemIdentifier = '##new-item##';

export type State_EditorBase<T extends DB_Object> = {
	items: Readonly<T[]>;
	selectedItemId?: UniqueId | '##new-item##';
	editedItem?: EditableDBItem<T>;
};

export abstract class EditorBase<T extends DB_Object, S extends State_EditorBase<T>, P extends {} = {}>
	extends SmartComponent<P, S> {

	abstract readonly module: ModuleFE_BaseApi<T>;
	abstract readonly itemName: string;
	abstract readonly itemNamePlural: string;
	abstract readonly itemDisplay: (item: T) => string;

	//######################### Logic #########################

	private selectItem = (itemId?: string) => {
		if (!itemId)
			return this.setState({selectedItemId: undefined, editedItem: undefined});

		const item = itemId === newItemIdentifier ? {} : this.state.items.find(item => item._id === itemId);

		if (!item)
			throw new BadImplementationException(`Could not find item with id ${itemId}`);

		const newVar: any = {editedItem: new EditableDBItem<T>(item, this.module)};
		return this.reDeriveState({...newVar, selectedItemId: newVar.editedItem.item._id});
	};

	protected saveItem = async (e: React.MouseEvent) => {
		if (!this.state.editedItem)
			return;

		this.logDebug('Saving Item', this.state.editedItem.item);
		await genericNotificationAction(
			() => this.state.editedItem!.save(),
			`Saving ${this.itemName}`, 3);
	};

	private deleteItem = async () => {
		if (!this.state.editedItem)
			return;

		await genericNotificationAction(
			() => this.state.editedItem!.delete(),
			`Deleting ${this.itemName}`, 3);
	};

	protected setProperty = <K extends keyof T>(key: K, value: T[K]) => {
		if (!this.state.editedItem)
			throw new ThisShouldNotHappenException('Got to setting property without an edited item in state');

		this.state.editedItem.update(key, value);
		this.forceUpdate();
	};

	//######################### Render #########################

	private renderList = () => {
		const items = sortArray(cloneArr(this.state.items as T[]), i => this.itemDisplay(i));
		return <LL_V_L className={'item-list'}>
			<div className={'item-list__header'}>{this.itemNamePlural}</div>
			<LL_V_L className={'item-list__list'}>
				{items.map(item => {
					const className = _className('item-list__list-item', item._id === this.state.selectedItemId ? 'selected' : undefined);
					return <div className={className} onClick={() => this.selectItem(item._id)}
											key={item._id}>{this.itemDisplay(item)}</div>;
				})}
			</LL_V_L>
			{this.renderListButton()}
		</LL_V_L>;
	};

	protected renderListButton = () => {
		return <TS_Button className={'item-list__add-button'} onClick={() => this.selectItem(newItemIdentifier)}>Add
			New {this.itemName}</TS_Button>;
	};

	abstract editorContent: () => React.ReactNode;

	private renderEditor = () => {
		if (!this.state.editedItem)
			return '';

		const item = this.state.editedItem;

		return <LL_V_L className={'item-editor'}>
			<div
				className={'item-editor__header'}>{item.item._id ? this.itemDisplay(item.item as T) : `New ${this.itemName}`}</div>
			<LL_V_L className={'item-editor__main'}>
				{this.editorContent()}
			</LL_V_L>
			<LL_H_C className={'item-editor__buttons'}>
				{item.item._id &&
					<TS_BusyButton onClick={this.deleteItem} className={'delete-button'}>Delete</TS_BusyButton>}
				<TS_Button onClick={() => this.selectItem()}>Cancel</TS_Button>
				<TS_BusyButton onClick={this.saveItem}>Save</TS_BusyButton>
			</LL_H_C>
		</LL_V_L>;
	};

	render() {
		return <LL_H_C className={'permissions-editor match_parent'}>
			{this.renderList()}
			{this.renderEditor()}
		</LL_H_C>;
	}
}