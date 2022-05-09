/*
 * A typescript & react boilerplate with api call example
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
import {AdapterBuilder, BaseNodeRenderer, TreeData_MultiType, TreeItem, TreeRendererMap, TS_Tree} from '@nu-art/thunderstorm/frontend';
import {PG_Example} from '../_core/PG_Example';

type State = { focused?: string, actionMessage: string };

type Person = {
	name: string,
	lastName: string,
}

type Cat = {
	name: string,
}

// type Dog = {
// 	name: string,
// }

export class ItemRenderer_Cat
	extends BaseNodeRenderer<Cat> {

	renderItem(item: Cat) {
		return (
			<div className={`ll_h_c match_width`} style={{justifyContent: 'space-between'}}>
				{item.name}
			</div>
		);
	}
}

export class ItemRenderer_Person
	extends BaseNodeRenderer<Person> {

	renderItem(item: Person) {
		return (
			<div className={`ll_h_c match_width`} style={{justifyContent: 'space-between'}}>
				{item.name} {item.lastName}
			</div>
		);
	}
}

export class ItemRenderer_Title
	extends BaseNodeRenderer<string> {

	renderItem(item: string) {
		return (
			<div className={`ll_h_c match_width`} style={{justifyContent: 'space-between'}}>
				<div style={{fontWeight: 'bold', fontSize: 24}}>{item}</div>
			</div>
		);
	}
}

// type TypeMap ={
// 	person:Person
// 	cat:Cat
// 	title: string
// }

const ItemsRendererMap: TreeRendererMap = {
	person: ItemRenderer_Person,
	cat: ItemRenderer_Cat,
	title: ItemRenderer_Title
};

const CAT_Mulan: TreeItem<Cat> = {type: 'cat', item: {name: 'Mulan'}};

const CAT_Lili = {type: 'cat', item: {name: 'Lili'}};

const PERSON_Adam: TreeItem<Person | Cat> = {
	type: 'person',
	item: {name: 'Adam', lastName: 'van der Kruk'},
	_children: [CAT_Lili, CAT_Mulan]
};
const PERSON_Alan: TreeItem<Person | Cat> = {
	type: 'person',
	item: {name: 'Alan', lastName: 'stronzo'},
	_children: [CAT_Lili, CAT_Mulan]
};

class Example_Tree_MultiType
	extends React.Component<{}, State> {

	state = {actionMessage: 'No action yet'};


	private elements: TreeData_MultiType<typeof ItemsRendererMap> = {
		type: 'title',
		item: 'People',
		_children: [PERSON_Adam, PERSON_Alan]
	};

	render() {
		const adapter = AdapterBuilder()
			.tree()
			.multiRender(ItemsRendererMap)
			.setData(this.elements)
			.build();

		return <>
			<TS_Tree
				id={name}
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				// onFocus={() => console.log("Focused")}
				// onBlur={() => console.log("Blurred")}
			/>
			<div className="ts-playground__results">{this.state.actionMessage}</div>
		</>;
	}
}

const name = 'Tree - MultiType';

export function Playground_Tree_MultiType() {
	return {
		renderer: () => <PG_Example name={name}> <Example_Tree_MultiType/> </PG_Example>,
		name
	};
}