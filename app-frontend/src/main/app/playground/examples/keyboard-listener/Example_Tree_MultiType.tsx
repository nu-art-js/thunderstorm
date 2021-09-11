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

import * as React from "react";
import {AdapterBuilder, BaseNodeRenderer, TreeData_MultiType, TreeItem, TreeRendererMap, TS_Tree} from "@nu-art/thunderstorm/frontend";
import {PlaygroundExample_ResultStyle} from "../consts";
import {PG_Example} from "../_core/PG_Example";
import {optionRendererStyle} from "../dropdown/consts";

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
			<div className="ll_h_c clickable match_width"
					 id={this.props.node.path}
					 onClick={this.props.node.onClick}
					 style={(this.props.node.focused) ? {backgroundColor: "lightgreen"} : {}}>

				<div className={optionRendererStyle(this.props.node.selected)}>
					<div className={`ll_h_c match_width`} style={{justifyContent: "space-between"}}>
						{item.name}
					</div>
				</div>
			</div>
		);
	}
}

export class ItemRenderer_Person
	extends BaseNodeRenderer<Person> {

	renderItem(item: Person) {
		return (
			<div className="ll_h_c clickable match_width"
					 id={this.props.node.path}
					 onClick={this.props.node.onClick}
					 style={(this.props.node.focused) ? {backgroundColor: "lightblue"} : {}}>

				<div className={optionRendererStyle(this.props.node.selected)}>
					<div className={`ll_h_c match_width`} style={{justifyContent: "space-between"}}>
						{item.name} {item.lastName}
					</div>
				</div>
			</div>
		);
	}
}

export class ItemRenderer_Title
	extends BaseNodeRenderer<string> {

	renderItem(item: string) {
		return (
			<div className="ll_h_c clickable match_width">
				<div className={optionRendererStyle(this.props.node.selected)}>
					<div className={`ll_h_c match_width`} style={{justifyContent: "space-between"}}>
						<div style={{fontWeight: "bold", fontSize: 24}}>{item}</div>
					</div>
				</div>
			</div>
		);
	}
}

const ItemsRendererMap: TreeRendererMap = {
	person: ItemRenderer_Person,
	cat: ItemRenderer_Cat,
	title: ItemRenderer_Title
};

// const CAT_Mulan:TreeItem<Cat> = {type: "cat", item: {name: "Mulan"}};

const CAT_Lili = {type: "cat", item: {name: "Lili"}};

const PERSON_Adam: TreeItem<Person | Cat> = {
	type: "person",
	item: {name: "Adam", lastName: "van der Kruk"},
	_children: [CAT_Lili]
};

class Example_Tree_MultiType
	extends React.Component<{}, State> {

	state = {actionMessage: "No action yet"};


	private elements: TreeData_MultiType<typeof ItemsRendererMap> = {
		type: "title",
		item: "People",
		_children: [PERSON_Adam]
	};

	render() {
		const adapter = AdapterBuilder()
			.tree()
			.multiRender(ItemsRendererMap)
			.setData(this.elements)
			.build();

		return <>
			<TS_Tree
				id={"VerySimpleTree"}
				adapter={adapter}
				onNodeFocused={(path: string) => this.setState({actionMessage: `on focused: ${path}`})}
				onNodeClicked={(path: string) => this.setState({actionMessage: `on clicked: ${path}`})}
				// onFocus={() => console.log("Focused")}
				// onBlur={() => console.log("Blurred")}
			/>
			<div {...PlaygroundExample_ResultStyle}>{this.state.actionMessage}</div>
		</>
	}
}

const name = "Tree - MultiType";

export function Playground_Tree_MultiType() {
	return {
		renderer: () => <PG_Example name={name}> <Example_Tree_MultiType/> </PG_Example>,
		name
	};
}