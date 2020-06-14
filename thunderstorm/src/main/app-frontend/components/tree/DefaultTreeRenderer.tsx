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

import * as React from "react";
import {
	TreeNode,
} from "./types";

export class SimpleTreeNodeRenderer
	extends React.Component<TreeNode> {


	constructor(props: TreeNode) {
		super(props);
	}

	renderCollapse() {
		let toDisplay;
		if (typeof this.props.item !== "object")
			toDisplay = "";
		else if (Object.keys(this.props.item).length === 0)
			toDisplay = "";
		else if (this.props.expanded)
			toDisplay = "-";
		else
			toDisplay = "+";

		return <div className={`clickable`} id={this.props.path} onClick={this.props.expandToggler} style={{width: "15px"}}>{toDisplay}</div>
	}

	render() {
		return (<div className="ll_h_c">
			{this.renderCollapse()}
			<div
				id={this.props.path}
				className='clickable'
				onClick={this.props.onClick}
				style={{backgroundColor: this.props.focused ? "red" : "salmon", userSelect: "none"}}>

				<SimpleNodeRenderer {...this.props}/>
			</div>
		</div>);
	};
}

export class SimpleNodeRenderer
	extends React.Component<TreeNode> {

	render() {
		let label;
		let item = this.props.item;
		if (typeof item !== "object")
			label = ` : ${item}`;
		else if (Object.keys(item).length === 0)
			label = " : {}";
		else
			label = "";

		return (this.props.propKey || "root") + label
	}
}