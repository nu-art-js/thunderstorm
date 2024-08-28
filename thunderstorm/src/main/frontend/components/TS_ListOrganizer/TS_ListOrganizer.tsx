/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import {ReactNode} from 'react';
import './TS_ListOrganizer.scss';
import {LL_V_L} from '../Layouts';
import {ComponentSync} from '../../core/ComponentSync';
import {exists, swapInArrayByIndex} from '@thunder-storm/common';


type State<T> = {
	items: T[]
}

export type TS_ListOrganizer_RendererProps<T> = {
	item: T;
	index: number;
	dragged: boolean;
	onDragStart: (e: React.DragEvent<HTMLElement>, itemIndex: number) => void;
	onDragOver: (e: React.DragEvent<HTMLElement>, itemIndex: number) => void;
	onDragLeave: (e: React.DragEvent<HTMLElement>, itemIndex: number) => void;
	onDragEnd: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

type Props<T> = {
	items: T[]
	renderer: (props: TS_ListOrganizer_RendererProps<T>) => ReactNode;
	onOrderChanged: (items: T[]) => void | Promise<void>;
}

export class TS_ListOrganizer<T>
	extends ComponentSync<Props<T>, State<T>> {

	private draggedItemIndex: number | undefined = undefined;
	private lockRowIndex: number | undefined = undefined;
	private activeDrag: true | undefined = undefined;

	//######################### Lifecycle #########################

	protected deriveStateFromProps(nextProps: Props<T>, state: State<T>): State<T> {
		state.items = [...nextProps.items];
		return state;
	}

	//######################### Logic #########################

	onDragStart = (e: React.DragEvent<HTMLElement>, rowIndex: number) => {
		e.stopPropagation();
		this.draggedItemIndex = rowIndex;
		this.activeDrag = true;
		this.forceUpdate();
	};

	onDragOver = (e: React.MouseEvent<HTMLElement, MouseEvent>, rowIndex: number) => {
		e.stopPropagation();
		if (rowIndex === this.lockRowIndex)
			return;

		if (!this.activeDrag)
			return;

		if (!exists(this.draggedItemIndex) || this.draggedItemIndex === rowIndex)
			return;

		swapInArrayByIndex(this.state.items, rowIndex, this.draggedItemIndex);
		this.lockRowIndex = this.draggedItemIndex;
		this.draggedItemIndex = rowIndex;
		this.forceUpdate();
	};

	onDragEnd = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		e.stopPropagation();
		this.draggedItemIndex = undefined;
		this.lockRowIndex = undefined;
		this.activeDrag = undefined;
		this.forceUpdate(() => this.props.onOrderChanged(this.state.items));
	};

	onDragLeave = (e: React.MouseEvent<HTMLElement, MouseEvent>, rowIndex: number) => {
		e.stopPropagation();
		if (!this.activeDrag)
			return;

		if (rowIndex === this.lockRowIndex)
			this.lockRowIndex = undefined;
	};

	//######################### Render #########################

	render() {
		return <LL_V_L className={'ts-list-organizer__list'}>
			{this.state.items.map((item, itemIndex) => {
				const dragged = itemIndex === this.draggedItemIndex;
				return this.props.renderer({
					item,
					dragged,
					index: itemIndex,
					onDragEnd: this.onDragEnd,
					onDragOver: this.onDragOver,
					onDragLeave: this.onDragLeave,
					onDragStart: this.onDragStart,
				});

			})}
		</LL_V_L>;
	}
}