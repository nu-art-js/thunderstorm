import {ReactNode} from 'react';
import {EditableItem} from '../../utils/EditableItem';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {DBProto} from '@nu-art/ts-common';
import {Controller, Props_Controller} from '../../core/Controller';
import {InferState} from '../../utils/types';


export type EditableRef<Item> = { editable: EditableItem<Item> };
type _State<Item> = EditableRef<Item> & {
	tag?: string
}

export type EditableContentType<Opt> = Opt extends DBProto<any> ? Opt['uiType'] : Opt;

export abstract class TS_EditableContent<Opt, P = {}, S = {}, ItemType extends EditableContentType<Opt> = EditableContentType<Opt>,
	Props extends P & EditableRef<ItemType> & Props_Controller = P & EditableRef<ItemType> & Props_Controller,
	State extends S & _State<ItemType> = S & _State<ItemType>>
	extends Controller<Props, State> {

	shouldReDeriveState(nextProps: Readonly<Props>): boolean {
		// if (!this.state)
		// 	throw new BadImplementationException(`Check if you have overridden 'deriveStateFromProps' without calling super.`);

		if (this.state.tag !== nextProps.editable.tag)
			return true;

		return super.shouldReDeriveState(nextProps);
	}

	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		if (this.state.tag !== nextState.editable.tag)
			return true;

		return super.shouldComponentUpdate(nextProps, nextState, nextContext);
	}


	protected deriveStateFromProps(nextProps: Props, state: State): InferState<this> {
		state.editable = nextProps.editable;
		state.tag = nextProps.editable.tag;
		return state as InferState<this>;
	}

	protected renderProp(label: string, render: ReactNode, className?: string) {
		return this.renderPropVertical(label, render, className);
	}

	protected renderPropVertical(label: string, render: ReactNode, className?: string) {
		return (
			<TS_PropRenderer.Vertical label={label} className={className}>
				{render}
			</TS_PropRenderer.Vertical>
		);
	}

	protected renderPropHorizontal(label: string, render: ReactNode, className?: string) {
		return (
			<TS_PropRenderer.Horizontal label={label} className={className}>
				{render}
			</TS_PropRenderer.Horizontal>
		);
	}

	item = (): Partial<ItemType> => this.state.editable.item;
}
