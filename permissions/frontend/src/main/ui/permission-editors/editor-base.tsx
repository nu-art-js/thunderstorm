import * as React from 'react';
import {InferProps, InferState, LL_V_L} from '@nu-art/thunder-widgets';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {type EditableRef, TS_EditableContent} from '@nu-art/editable-item';
import './editor-base.scss';
import {DB_Prototype} from '@nu-art/db-api-shared';

//Editors refactor WIP

type ItemEditor_Props<T extends DB_Prototype<any>> = EditableRef<T['uiType']> & {
	displayResolver?: (item: T['dbType']) => string
	module?: ModuleFE_BaseApi<T>
}

type ItemEditor_State<T extends DB_Prototype<any>> = EditableRef<T['uiType']> & {}

export abstract class Component_BasePermissionItemEditor<
	Proto extends DB_Prototype<any>,
	Props extends ItemEditor_Props<Proto> = ItemEditor_Props<Proto>,
	State extends ItemEditor_State<Proto> = ItemEditor_State<Proto>>
	extends TS_EditableContent<Proto, Props, State> {

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>): InferState<this> {
		super.deriveStateFromProps(nextProps, state);
		state.editable.setOnChanged(async () => this.forceUpdate());
		return state;
	}

	abstract editorContent: () => React.ReactNode;

	render() {
		if (!this.state.editable)
			return '';

		const editable = this.state.editable;

		return <>
			<div
				className={'item-editor__header'}>{editable.item._id ? this.props.displayResolver?.(editable.item) : `New ${this.props.module!.dbDef.entityName}`}</div>
			<LL_V_L className={'item-editor__main'}>
				{this.editorContent()}
			</LL_V_L>
		</>;
	}
}