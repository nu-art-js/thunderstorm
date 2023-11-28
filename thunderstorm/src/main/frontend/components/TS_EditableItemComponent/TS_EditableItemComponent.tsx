import {ReactNode} from 'react';
import * as React from 'react';
import {EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core';
import {TS_PropRenderer} from '../TS_PropRenderer';


export type EditableRef<Item> = { editable: EditableItem<Item> };

export abstract class TS_EditableItemComponent<ItemType, P = {}, S = {}>
	extends ComponentSync<P & EditableRef<ItemType>, S & EditableRef<ItemType>> {

	protected deriveStateFromProps(nextProps: P & EditableRef<ItemType>): S & EditableRef<ItemType> {
		return {
			editable: nextProps.editable,
		} as S & EditableRef<ItemType>;
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
