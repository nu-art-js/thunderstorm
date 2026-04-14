import * as React from 'react';
import './TS_EditableItemController.scss';
import {BadImplementationException, DB_Object, exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {Editable_SaveAction, EditableDBItem} from '../../core/EditableItem.js';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ComponentSync} from '@nu-art/thunder-widgets';
import {EditableRef} from '../TS_EditableContent/types.js';
import {ApiCallerEventType, DB_Prototype} from '@nu-art/db-api-shared';
import type {Props_ItemsEditor} from '../../items-editor-contract.js';

export type TemplatingProps_EditableItemController<Database extends DB_Prototype<any>, EditorProps extends object = object> = {
	module: ModuleFE_BaseApi<Database>;
	onError?: (item: Partial<Database['uiType']>, err: Error) => any | Promise<any>;
	onSave?: (err: Database['uiType']) => any | Promise<any>;
	autoSave?: ResolvableContent<boolean, [
		Readonly<Database['uiType']>
	]>;
	saveAction?: Editable_SaveAction<Database['uiType']>;
	editor: React.ComponentType<EditableRef<Database['uiType']> & EditorProps>;
	createInitialInstance?: () => Readonly<Partial<Database['uiType']>>;
	editorProps?: EditorProps;
};
export type Props_EditableItemController<Database extends DB_Prototype<any>, EditorProps extends object = object> =
	TemplatingProps_EditableItemController<Database, EditorProps>
	& {
	item?: Readonly<Partial<Database['uiType']>> | string;
};

/**
 * Item_EditorController class handles the editing of a specific db item
 * and encapsulate logic to load the item from the local cache and uses the EditableItem to
 * and TS_EditableContent for rendering and editing the db item.
 *
 * @template Proto - The database prototype def to be edited
 * @template Props - The Props this class component takes
 */
export class TS_EditableItemController<Database extends DB_Prototype<any>, EditorProps extends object = object, Props extends Props_EditableItemController<Database, EditorProps> = Props_EditableItemController<Database, EditorProps>>
	extends ComponentSync<Props, EditableRef<Database['uiType']>> {
	static DefaultAutoSave = (item?: Partial<DB_Object>) => {
		return !!item?._id;
	};

	constructor(p: Props) {
		super(p);
		this.logWarning('Missing dispatcher.. will not listen for updates');
		// const method = p.module.method;
		// // @ts-ignore
		// this[method] = this.__onItemUpdated;
	}

	// @ts-ignore
	private __onItemUpdated = (...params: ApiCallerEventType<Database['dbType']>): void => {
		const itemId = this.state.editable.get('_id');
		if (!itemId)
			return;
		let updatedItem;
		if (!(params[0] === 'upsert-all' && (updatedItem = params[1].find(item => item._id === itemId))))
			return;
		this.state.editable?.setConflictingItem(updatedItem);
	};

	protected deriveStateFromProps(nextProps: Props & Props_ItemsEditor<Database>, state?: Partial<EditableRef<Database['uiType']>>): (EditableRef<Database['uiType']>) {
		const _state = (state || {}) as EditableRef<Database['uiType']>;
		let item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
		if (!exists(item))
			item = this.props.createInitialInstance?.();
		if (!item)
			throw new BadImplementationException('in order to use this component to create an item you need to provide a createInitialInstance callback');
		_state.editable = new EditableDBItem(item, nextProps.module, nextProps.onError)
			.setOnChanged(async (editable) => {
				this.setState({editable});
			})
			.setAutoSave(resolveContent(nextProps.autoSave || TS_EditableItemController.DefaultAutoSave, item) || false)
			.setOnSaveCompleted(this.props.onSave);
		if (nextProps.saveAction)
			_state.editable.setSaveAction(nextProps.saveAction);
		return _state;
	}

	render() {
		const Editor: React.ComponentType<EditableRef<Database['uiType']> & EditorProps> = this.props.editor;
		return <Editor editable={this.state.editable} {...(this.props.editorProps || {} as EditorProps)}/>;
	}
}
