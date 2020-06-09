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
	TreeNodeItem
} from "./types";

export const DefaultTreeRenderer = () => {
	return (props: TreeNode) => {
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
				id={props.path}
				className={`${(props.item as TreeNodeItem).action || props.onClick || props.onDoubleClick ? 'clickable' : ''}`}
				onClick={props.onClick}
				style={{backgroundColor: props.focused ? "lime" : "unset", userSelect: "none"}}
				onDoubleClick={(props.item as TreeNodeItem).action || props.onDoubleClick}>{props.name || "root"} {label} </div>
		</div>);
	};
}