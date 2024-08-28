import * as React from 'react';
import {LL_V_L, ModuleFE_BaseApi} from '@thunder-storm/core/frontend';
import {DBProto} from '@thunder-storm/common';
import './editor-base.scss';
import {
	EditableRef,
	TS_EditableItemComponentProto
} from '@thunder-storm/core/frontend/components/TS_EditableItemComponent/TS_EditableItemComponent';

//Editors refactor WIP

type ItemEditor_Props<T extends DBProto<any>> = EditableRef<T['uiType']> & {
	displayResolver?: (item: T['dbType']) => string
	module?: ModuleFE_BaseApi<T>
}

type ItemEditor_State<T extends DBProto<any>> = EditableRef<T['uiType']> & {}

export abstract class Component_BasePermissionItemEditor<
	Proto extends DBProto<any>,
	Props extends ItemEditor_Props<Proto> = ItemEditor_Props<Proto>,
	State extends ItemEditor_State<Proto> = ItemEditor_State<Proto>> extends TS_EditableItemComponentProto<Proto, Props, State> {

	abstract editorContent: () => React.ReactNode;

	render() {
		if (!this.state.editable)
			return '';

		const item = this.state.editable;

		return <>
			<div
				className={'item-editor__header'}>{item.item._id ? this.props.displayResolver?.(item.item as Proto) : `New ${this.props.module!.dbDef.entityName}`}</div>
			<LL_V_L className={'item-editor__main'}>
				{this.editorContent()}
			</LL_V_L>
		</>;
	}
}