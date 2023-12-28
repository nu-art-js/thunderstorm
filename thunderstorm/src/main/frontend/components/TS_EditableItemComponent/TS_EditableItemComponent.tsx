import {ReactNode} from 'react';
import * as React from 'react';
import {EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {DBProto} from '@nu-art/ts-common';


export type EditableRef<Item> = { editable: EditableItem<Item> };

export abstract class TS_EditableItemComponent<ItemType, P = {}, S = {},
	Props extends P & EditableRef<ItemType> = P & EditableRef<ItemType>,
	State extends S & EditableRef<ItemType> = S & EditableRef<ItemType>>
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.editable = nextProps.editable;
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
	Props extends P & EditableRef<Proto['dbType']> = P & EditableRef<Proto['dbType']>,
	State extends S & EditableRef<Proto['dbType']> = S & EditableRef<Proto['dbType']>>
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.editable = nextProps.editable;
		return state;
	}

	protected renderProp(label: string, render: ReactNode, className?: string) {
		return (
			<TS_PropRenderer.Vertical label={label} className={className}>
				{render}
			</TS_PropRenderer.Vertical>
		);
	}

	item = (): Partial<Proto['dbType']> => this.state.editable.item;
}
