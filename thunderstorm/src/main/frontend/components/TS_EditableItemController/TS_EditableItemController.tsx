import * as React from 'react';
import './TS_EditableItemController.scss';
import {BadImplementationException, DB_Object, DBProto, exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {Editable_SaveAction, EditableDBItemV3} from '../../utils/EditableItem';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ApiCallerEventType} from '../../core/db-api-gen/types';
import {Props_ItemsEditor} from '../Page_ItemsEditor';
import {EditableRef} from '../TS_EditableItemComponent/TS_EditableItemComponent';
import {ComponentSync} from '../../core/ComponentSync';


export type TemplatingProps_EditableItemController<Proto extends DBProto<any>, EditorProps extends object = object> = {
	module: ModuleFE_BaseApi<Proto>,
	onError?: (item: Partial<Proto['uiType']>, err: Error) => any | Promise<any>
	onSave?: (err: Proto['uiType']) => any | Promise<any>
	autoSave?: ResolvableContent<boolean, [Readonly<Proto['uiType']>]>
	saveAction?: Editable_SaveAction<Proto['uiType']>
	editor: React.ComponentType<EditableRef<Proto['uiType']> & EditorProps>
	createInitialInstance?: () => Readonly<Partial<Proto['uiType']>>
	editorProps?: EditorProps
};

export type Props_EditableItemController<Proto extends DBProto<any>, EditorProps extends object = object> =
	TemplatingProps_EditableItemController<Proto, EditorProps>
	& {
	item?: Readonly<Partial<Proto['uiType']>> | string,
};

/**
 * Item_EditorController class handles the editing of a specific db item
 * and encapsulate logic to load the item from the local cache and uses the EditableItem to
 * and TS_EditableItemComponent for rendering and editing the db item.
 *
 * @template Proto - The database prototype def to be edited
 * @template Props - The Props this class component takes
 */
export class TS_EditableItemController<Proto extends DBProto<any>,
	EditorProps extends object = object,
	Props extends Props_EditableItemController<Proto, EditorProps> = Props_EditableItemController<Proto, EditorProps>>
	extends ComponentSync<Props, EditableRef<Proto['uiType']>> {

	static DefaultAutoSave = (item?: Partial<DB_Object>) => {
		return !!item?._id;
	};

	constructor(p: Props) {
		super(p);

		const method = p.module.defaultDispatcher.method;
		// @ts-ignore
		this[method] = this.__onItemUpdated;
	}

	private __onItemUpdated = (...params: ApiCallerEventType<Proto>): void => {
		const itemId = this.state.editable.get('_id');
		if (!itemId)
			return;

		let updatedItem;
		if (!(params[0] === 'upsert-all' && (updatedItem = params[1].find(item => item._id === itemId))))
			return;

		this.state.editable?.setConflictingItem(updatedItem);
	};

	protected deriveStateFromProps(nextProps: Props & Props_ItemsEditor<Proto>, state?: Partial<EditableRef<Proto['uiType']>>): (EditableRef<Proto['uiType']>) {
		const _state = (state || {}) as EditableRef<Proto['uiType']>;
		let item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
		if (!exists(item))
			item = this.props.createInitialInstance?.();

		if (!item)
			throw new BadImplementationException('in order to use this component to create an item you need to provide a createInitialInstance callback');

		_state.editable = new EditableDBItemV3(item, nextProps.module, nextProps.onError)
			.setOnChanged(async editable => {
				this.setState({editable});
			})
			.setAutoSave(resolveContent(nextProps.autoSave || TS_EditableItemController.DefaultAutoSave, item) || false)
			.setOnSaveCompleted(this.props.onSave);

		if (nextProps.saveAction)
			_state.editable.setSaveAction(nextProps.saveAction);
		return _state;
	}

	render() {
		const Editor: React.ComponentType<EditableRef<Proto['uiType']> & EditorProps> = this.props.editor;
		return <Editor editable={this.state.editable} {...(this.props.editorProps || {} as EditorProps)}/>;
	}
}
