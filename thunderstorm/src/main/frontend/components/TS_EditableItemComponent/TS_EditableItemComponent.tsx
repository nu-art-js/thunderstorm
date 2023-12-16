import {ReactNode} from 'react';
import * as React from 'react';
import {EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_PropRenderer} from '../TS_PropRenderer';


export type EditableRef<Item> = { editable: EditableItem<Item> };

export abstract class TS_EditableItemComponent<ItemType, P = {}, S = {},
	Props extends P & EditableRef<ItemType> = P & EditableRef<ItemType>,
	State extends S & EditableRef<ItemType> = S & EditableRef<ItemType>>
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state ??= this.state ? {...this.state} : {} as State;
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
