import * as React from 'react';
import './TS_EditableItemControllerProto.scss';
import {asArray, BadImplementationException, DB_Object, DBProto, deepClone, exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {EditableDBItemV3} from '../../utils/EditableItem';
import {ModuleFE_v3_BaseApi} from '../../modules/db-api-gen/ModuleFE_v3_BaseApi';
import {ApiCallerEventTypeV3} from '../../core/db-api-gen/v3_types';
import {ComponentProtoDef} from '../Page_ItemsEditorV3';
import {EditableRef} from '../TS_EditableItemComponent/TS_EditableItemComponent';
import {ProtoComponent} from '../../core/proto-component';
import {InferProps, InferState} from '../../utils/types';


export type Props_EditableItemControllerProto<Proto extends DBProto<any>, EditorProps extends {} = {}> =
	& ComponentProtoDef['props']
	& {
	item?: Readonly<Partial<Proto['uiType']>> | string,
	module: ModuleFE_v3_BaseApi<Proto>,
	onError?: (err: Error) => any | Promise<any>
	autoSave?: ResolvableContent<boolean, [Readonly<Proto['uiType']>]>
	editor: React.ComponentType<EditableRef<Proto['uiType']> & EditorProps>
	createInitialInstance?: () => Readonly<Partial<Proto['uiType']>>
	editorProps?: EditorProps
};

/**
 * Item_EditorController class handles the editing of a specific db item
 * and encapsulate logic to load the item from the local cache and uses the EditableItem to
 * and TS_EditableItemComponent for rendering and editing the db item.
 *
 * @template Proto - The database prototype def to be edited
 * @template Props - The Props this class component takes
 */
export class TS_EditableItemControllerProto<Proto extends DBProto<any>,
	EditorProps extends {} = {},
	Props extends Props_EditableItemControllerProto<Proto, EditorProps> = Props_EditableItemControllerProto<Proto, EditorProps>>
	extends ProtoComponent<ComponentProtoDef, Props, EditableRef<Proto['uiType']>> {

	static DefaultAutoSave = (item?: Partial<DB_Object>) => {
		return !!item?._id;
	};

	constructor(p: InferProps<TS_EditableItemControllerProto<Proto, EditorProps, Props>>) {
		super(p);

		const method = p.module.defaultDispatcher.method;
		// @ts-ignore
		this[method] = this.__onItemUpdated;
	}

	private __onItemUpdated = (...params: ApiCallerEventTypeV3<Proto>): void => {
		const itemId = this.state.editable.get('_id');
		if (!itemId)
			return;

		if (!(params[0] === 'update' && params[1]._id === itemId))
			return;

		this.state.editable?.updateItem(deepClone(asArray(params[1]))[0]);
	};

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		const _state = (state || {}) as InferState<this>;
		const selectedId = this.getQueryParam('selected')?.[this.props.module.dbDef.dbKey];

		let item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
		if (!exists(item))
			item = nextProps.module.cache.unique(selectedId);

		if (!exists(item))
			item = this.props.createInitialInstance?.();

		if (!item)
			throw new BadImplementationException('in order to use this component to create an item you need to provide a createInitialInstance callback');

		_state.editable = new EditableDBItemV3(item, nextProps.module, nextProps.onError)
			.setOnChanged(async editable => {
				this.setState({editable});
			})
			.setAutoSave(resolveContent(nextProps.autoSave || TS_EditableItemControllerProto.DefaultAutoSave, item) || false);
		return _state;
	}

	render() {
		const Editor: React.ComponentType<EditableRef<Proto['uiType']> & EditorProps> = this.props.editor;
		return <Editor editable={this.state.editable} {...(this.props.editorProps || {} as EditorProps)}/>;
	}
}
