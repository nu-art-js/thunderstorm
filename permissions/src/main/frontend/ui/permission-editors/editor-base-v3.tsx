import * as React from 'react';
import {
	_className,
	ComponentSync,
	EditableDBItemV3,
	genericNotificationAction,
	LL_H_C,
	LL_V_L,
	ModuleFE_v3_BaseApi,
	TS_BusyButton,
	TS_Button
} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, cloneArr, DBProto, sortArray, ThisShouldNotHappenException, UniqueId} from '@nu-art/ts-common';
import './editor-base.scss';
import {ModuleFE_SyncManagerV2} from '@nu-art/thunderstorm/frontend/modules/sync-manager/ModuleFE_SyncManagerV2';

const newItemIdentifier = '##new-item##';

export type State_EditorBaseV3<T extends DBProto<any>> = {
	items: Readonly<T['dbType'][]>;
	selectedItemId?: UniqueId | typeof newItemIdentifier;
	editedItem?: EditableDBItemV3<T>;
};

export abstract class EditorBaseV3<T extends DBProto<any>, S extends State_EditorBaseV3<T> = State_EditorBaseV3<T>, P extends {} = {}>
	extends ComponentSync<P, S> {

	abstract readonly module: ModuleFE_v3_BaseApi<T>;
	abstract readonly itemName: string;
	abstract readonly itemNamePlural: string;
	abstract readonly itemDisplay: (item: T['dbType']) => string;

	//######################### Logic #########################

	private selectItem = (itemId?: string) => {
		if (!itemId)
			return this.setState({selectedItemId: undefined, editedItem: undefined});

		const item = itemId === newItemIdentifier ? {} : this.state.items.find(item => item._id === itemId);

		if (!item)
			throw new BadImplementationException(`Could not find item with id ${itemId}`);

		const newVar: any = {editedItem: new EditableDBItemV3<T>(item, this.module)};
		return this.reDeriveState({...newVar, selectedItemId: newVar.editedItem.item._id});
	};

	protected saveItem = async (e: React.MouseEvent) => {
		if (!this.state.editedItem)
			return;

		this.logDebug('Saving Item', this.state.editedItem.item);
		await genericNotificationAction(
			async () => {
				await this.state.editedItem!.save();
				return ModuleFE_SyncManagerV2.sync();
			}, `Saving ${this.itemName}`, 3);
	};

	private deleteItem = async () => {
		if (!this.state.editedItem)
			return;

		await genericNotificationAction(
			() => this.state.editedItem!.delete(),
			`Deleting ${this.itemName}`, 3);
	};

	protected setProperty = async <K extends keyof T['dbType']>(key: K, value: T[K]) => {
		if (!this.state.editedItem)
			throw new ThisShouldNotHappenException('Got to setting property without an edited item in state');

		const values: {} = {[key]: value};
		await this.state.editedItem.updateObj(values);
		this.forceUpdate();
	};

	//######################### Render #########################

	private renderList = () => {
		const items = sortArray(cloneArr(this.state.items as T['dbType'][]), i => this.itemDisplay(i));
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