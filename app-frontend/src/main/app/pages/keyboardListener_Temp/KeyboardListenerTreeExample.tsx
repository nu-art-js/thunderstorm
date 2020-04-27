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
import {Element} from '../Page_SpecialKeyboardListener'
import {
	KeyboardListenerTree,
	NodeProps
} from "./KeyboardListenerTree";

export class KeyboardListenerTreeExample
	extends React.Component<{}, { actionMessage: string }> {

	state = {actionMessage: "No action yet"};
	private elements: { [key: string]: Element } = {
		First: {
			label: 'First element',
			action: () => {
				this.setState({actionMessage: "You just performed the first element action!!"})
			}
		},
		Second: {
			label: 'Second element',
			action: () => {
				this.setState({actionMessage: "Yey! You executed 2nd element action!!"})
			}
		},
		Third: {
			label: 'Third element',
			action: () => {
				this.setState({actionMessage: "And now - number 3!!"})
			}
		},
		Forth: {
			label: "Forth element"
		}
	};

	render() {
		return <>
			<h1>NOW on a TREEEE</h1>
			<KeyboardListenerTree
				id={"KeyboardListenerTreeExample"}
				root={this.elements}
				renderer={MyTreeRenderer}
				onNodeDoubleClicked={() => this.setState({actionMessage: "This element doesn't have it's own action so I used onDoubleClick method"})}
				enableKeyboardControl={true}
				myListenerKey={'KeyboardListenerTreeExample'}
				// keyEventHandler={(e:MouseEvent)=>console.log("from props")}
				onBlur={() => this.setState({actionMessage: 'No action yet'})}
				onFocus={() => this.setState({actionMessage: "You're focused on the component"})}
			/>
			<h4>{this.state.actionMessage}</h4>
		</>
	}
}

const MyTreeRenderer = (props: NodeProps) => {
	function renderCollapse() {
		let toDisplay;
		if (typeof props.item !== "object")
			toDisplay = "";
		else if (Object.keys(props.item).length === 0)
			toDisplay = "";
		else if (props.expanded)
			toDisplay = "-";
		else
			toDisplay = "+";

		return <div className={`clickable`} id={props.path} onClick={props.expandToggler} style={{width: "15px"}}>{toDisplay}</div>
	}

	let label;
	if (typeof props.item !== "object")
		label = ` : ${props.item}`;
	else if (Object.keys(props.item).length === 0)
		label = " : {}";
	else
		label = "";

	return (<div className="ll_h_c">
		{renderCollapse()}
		<div
			className={`${typeof props.item === "object" ? 'clickable' : ''}`}
			style={{backgroundColor: props.focused ? "lime" : typeof props.item === "object" ? "lightblue" : "unset"}}
			id={props.path}
			onClick={props.onClick}
			onDoubleClick={(props.item as Element).action || props.onDoubleClick}>{props.name || "root"} {label} </div>
	</div>);
};