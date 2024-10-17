import * as React from 'react';
import {LL_V_L, ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {DBProto} from '@nu-art/ts-common';
import './editor-base.scss';
import {
	EditableRef,
	TS_EditableContent
} from '@nu-art/thunderstorm/frontend/components/TS_EditableContent/TS_EditableContent';
import {InferProps, InferState} from '@nu-art/thunderstorm/frontend/utils/types';

//Editors refactor WIP

type ItemEditor_Props<T extends DBProto<any>> = EditableRef<T['uiType']> & {
	displayResolver?: (item: T['dbType']) => string
	module?: ModuleFE_BaseApi<T>
}

type ItemEditor_State<T extends DBProto<any>> = EditableRef<T['uiType']> & {}

export abstract class Component_BasePermissionItemEditor<
	Proto extends DBProto<any>,
	Props extends ItemEditor_Props<Proto> = ItemEditor_Props<Proto>,
	State extends ItemEditor_State<Proto> = ItemEditor_State<Proto>> extends TS_EditableContent<Proto, Props, State> {

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		super.deriveStateFromProps(nextProps, state);
		state.editable.setOnChanged(async () => this.forceUpdate());
		return state;
	}

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