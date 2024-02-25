import {ReactNode} from 'react';
import * as React from 'react';
import {EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {DBProto} from '@nu-art/ts-common';


export type EditableRef<Item> = { editable: EditableItem<Item> };
type _State<Item> = EditableRef<Item> & {
	tag?: string
}

export abstract class TS_EditableItemComponent<ItemType, P = {}, S = {},
	Props extends P & EditableRef<ItemType> = P & EditableRef<ItemType>,
	State extends S & _State<ItemType> = S & _State<ItemType>>
	extends ComponentSync<Props, State> {

	shouldReDeriveState(nextProps: Readonly<Props>): boolean {
		if (this.state.tag !== nextProps.editable.tag)
			return true;

		return super.shouldReDeriveState(nextProps);
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		if (this.state.tag !== nextState.editable.tag)
			return true;

		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.editable = nextProps.editable;
		state.tag = nextProps.editable.tag;
		return state;
	}

	protected renderProp(label: string, render: ReactNode, className?: string) {
		return (
			<TS_PropRenderer.Vertical label={label} className={className}>
				{render}
			</TS_PropRenderer.Vertical>
		);
	}

	item = (): Partial<ItemType> => this.state.editable.item;
}

export abstract class TS_EditableItemComponentV3<Proto extends DBProto<any>, P = {}, S = {},
	UI_Type extends Proto['uiType'] = Proto['uiType'],
	Props extends P & EditableRef<UI_Type> = P & EditableRef<UI_Type>,
	State extends S & _State<UI_Type> = S & _State<UI_Type>,
>
	extends ComponentSync<Props, State> {

	shouldReDeriveState(nextProps: Readonly<Props>): boolean {
		if (this.state.tag !== nextProps.editable.tag)
			return true;

		return super.shouldReDeriveState(nextProps);
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		if (this.state.tag !== nextState.editable.tag)
			return true;

		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.editable = nextProps.editable;
		state.tag = nextProps.editable.tag;
		return state;
	}

	protected renderProp(label: string, render: ReactNode, className?: string) {
		return (
			<TS_PropRenderer.Vertical label={label} className={className}>
				{render}
			</TS_PropRenderer.Vertical>
		);
	}

	item = (): Partial<UI_Type> => this.state.editable.item;
}
