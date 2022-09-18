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
import './TS_ListOrganizer.scss';
import {_className} from '../../utils/tools';
import {ReactNode} from 'react';
import {LL_V_L} from '../Layouts';


type State<T> = {
	items: T[]
}

type Props<T> = {
	items: T[]
	renderer: (item: T, index: number) => ReactNode
	onOrderChanged: (items: T[]) => void | Promise<void>
}

export class TS_ListOrganizer<T>
	extends React.Component<Props<T>, State<T>> {

	private draggedItemIndex: { current: number | null } = {current: null};
	private draggedOverItemIndex: { current: number | null } = {current: null};

	onDragStart = (e: React.DragEvent<HTMLElement>, rowIndex: number) => {
		this.draggedItemIndex.current = rowIndex;
	};

	onDragEnter = (e: React.MouseEvent<HTMLElement, MouseEvent>, rowIndex: number) => {
		if (this.draggedItemIndex.current === null)
			return;

		this.draggedOverItemIndex.current = rowIndex;
		const items = [...this.state.items];
		const draggingItemContent = items[this.draggedItemIndex.current];

		items.splice(this.draggedItemIndex.current, 1);
		items.splice(this.draggedOverItemIndex.current, 0, draggingItemContent);

		this.draggedItemIndex.current = this.draggedOverItemIndex.current;
		this.draggedOverItemIndex.current = null;
		this.setState({items});
	};

	onDragEnd = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		this.draggedItemIndex = {current: null};
		this.forceUpdate();
	};

	render() {
		return <LL_V_L className={'ts-list-organizer__list'}>
			{this.state.items.map((item, itemIndex) => {
				const className = _className('ts-list-organizer__item', itemIndex === this.draggedItemIndex.current ? 'ts-list-organizer__dragged' : undefined);
				return <div
					key={itemIndex}
					className={className}
					draggable={'true'}
					onDragStart={(e) => this.onDragStart(e, itemIndex)}
					onDragOver={(e) => e.preventDefault()}
					onDragEnter={(e) => this.onDragEnter(e, itemIndex)}
					onDragEnd={this.onDragEnd}
				>{this.props.renderer(item, itemIndex)}</div>;
			})}
		</LL_V_L>;
	}
}