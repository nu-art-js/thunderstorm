/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
import {_keys} from "@nu-art/ts-common";

import {
	Tree,
	TreeNode
} from "../../components/Tree";
import {
	Collapsed,
	Expanded
} from "../../components/treeicons";
import {
	Menu,
	MenuItemWrapper,
} from "./MenuModule";
import {BaseComponent} from "../../core/BaseComponent";
import {RendererMap} from '../../types/renderer-map';
import {CSSProperties} from "react";

const stopPropagation = (e: MouseEvent | React.MouseEvent) => {
	e.preventDefault();
	e.stopPropagation();
};

type HMProps = {
	menu: Menu<any>,
	onNodeClicked?: Function,
	onNodeDoubleClicked?: Function,
	childrenContainerStyle?: CSSProperties
	id?: string
}

export class FixedMenu
	extends BaseComponent<HMProps> {

	render() {
		return <Tree
			id={this.props.id}
			root={this.props.menu}
			hideRootElement={true}
			nodeAdjuster={(obj: object) => {
				if (!_keys(obj).find(key => key === "_children"))
					return {data: obj};

				// @ts-ignore
				const objElement = obj['_children'];
				// @ts-ignore
				objElement.type = obj.type;
				// @ts-ignore
				objElement.item = obj.item;

				// @ts-ignore
				return {data: objElement, deltaPath: '_children'};
			}}
			onNodeClicked={this.props.onNodeClicked}
			onNodeDoubleClicked={this.props.onNodeDoubleClicked}
			propertyFilter={<T extends object>(obj: T, key: keyof T) => key !== "item" && key !== 'type'}
			indentPx={0}
			childrenContainerStyle={(level: number) => this.props.childrenContainerStyle || {
				backgroundColor: "#fff",
				boxSizing: "border-box",
				display: "inline-block",
				paddingLeft: 20,
				width: "-webkit-fill-available"
			}}
			// childrenContainerStyle={(level: number) => ({
			// 	backgroundColor: "#fff",
			// 	boxSizing: "border-box",
			// 	display: "inline-block",
			// 	paddingLeft: 20,
			// 	width: "-webkit-fill-available"
			// })}
			callBackState={(key: string, value: any, level: number) => true}
			renderer={GenericRenderer(this.props.menu.rendererMap)}
		/>
	}
}

const renderCollapse = (expanded: boolean) => {
	const Comp = expanded ? Expanded : Collapsed;
	return <Comp style={{color: "#00000050", verticalAlign: "text-top"}}/>
};

const GenericRenderer = (rendererMap: RendererMap) => {
	return (props: TreeNode) => {
		const itemWrapper = props.item as MenuItemWrapper<any, any>;
		const item = itemWrapper.item;
		const type = itemWrapper.type;

		const MyRenderer = rendererMap[type as string];
		// @ts-ignore
		const hasChildren = itemWrapper.length;

		return (
			<div style={hasChildren && {display: 'flex', justifyContent: 'space-between'}}>
				<MyRenderer item={item}/>
				{hasChildren && <div
					id={props.path}
					onMouseDown={(e) => stopPropagation(e)}
					onMouseUp={(e) => props.expandToggler(e, !props.expanded)}
					style={{cursor: "pointer", marginRight: 10}}
				>{renderCollapse(props.expanded)}</div>}
			</div>
		)
	};
};