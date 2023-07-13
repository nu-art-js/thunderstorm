import {ToastBuilder} from '@nu-art/thunderstorm/frontend';
import {_keys, capitalizeFirstLetter} from '@nu-art/ts-common';
import * as React from 'react';
import {Item_Editor, Props_ItemEditor, State_ItemEditor} from './Item_Editor';

export type Props_EditorRenderer<Item> = Props_ItemEditor<Item> & {
	creationMode?: boolean
	isInEditMode?: boolean
};

export type State_EditorRenderer<Item> = State_ItemEditor<Item> & {
	isInEditMode?: boolean,
	creationMode?: boolean
}

export function throwValidationException(err: any): void {
	new ToastBuilder().setContent(<div>
		<span className={'toast-text'}>
		{`Missing Fields: ${_keys(err.result).map((item) => capitalizeFirstLetter(item as string)).join(', ')}`}
	</span>
	</div>).setDuration(4000).show();
}

export class EditorRenderer_BaseImpl<Item, Props extends Props_EditorRenderer<Item> = Props_EditorRenderer<Item>, State extends State_EditorRenderer<Item> = State_EditorRenderer<Item>>
	extends Item_Editor<Item, Props> {

	protected deriveStateFromProps(nextProps: Props & Props_EditorRenderer<Item>, state: State & State_EditorRenderer<Item>): State_EditorRenderer<Item> | undefined {
		state = {} as State & State_EditorRenderer<Item>;

		state.isInEditMode = nextProps?.isInEditMode;
		state.creationMode = nextProps?.creationMode;

		return super.deriveStateFromProps(nextProps, state);
	}

	creationMode(): boolean {
		return !!this.props.creationMode;
	}

	editMode(): boolean {
		return !!this.props.isInEditMode;
	}
}
