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
import {CSSProperties} from 'react';
import {
	_keys,
} from "@nu-art/ts-common";
import {KeyboardListener} from '../../tools/KeyboardListener';
import {BaseTree} from "./BaseTree";
import {DefaultTreeRenderer} from "./DefaultTreeRenderer";
import {TreeRenderer} from "./types";


export class Tree
	extends BaseTree {

	render() {
		return <KeyboardListener
			id={this.props.id}
			onKeyboardEventListener={this.keyEventHandler}
			onFocus={this.props.onFocus}
			onBlur={this.blur}>
			{this.renderNode(this.props.root, "", "", 1)}
		</KeyboardListener>;
	}

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		let data = _data;
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.props.nodeAdjuster(data);
		data = adjustedNode.data;

		let renderChildren = true;
		let filteredKeys: any[] = [];

		const expanded = this.props.checkExpanded(this.state.expanded, nodePath);
		if (!expanded)
			renderChildren = false;

		if (typeof data !== "object")
			renderChildren = false;

		if (renderChildren)
			filteredKeys = _keys(data).filter((__key) => this.props.propertyFilter(data, __key));


		return <div key={nodePath}
		            ref={(_ref: HTMLDivElement) => {
			            if (this.rendererRefs[nodePath])
				            return;

			            this.rendererRefs[nodePath] = _ref;
			            if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				            this.forceUpdate();
		            }}>

			{this.renderItem(data, nodePath, key, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode)}
		</div>
	};

	private renderChildren(data: any, nodePath: string, _path: string, level: number, filteredKeys: any[], renderChildren: boolean, adjustedNode: { data: object; deltaPath?: string }) {
		if (!(filteredKeys.length > 0 && renderChildren))
			return;

		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return (
			<div
				style={this.getChildrenContainerStyle(level, this.rendererRefs[nodePath], containerRef, this.containerRefs[_path])}
				ref={(_ref: HTMLDivElement) => {
					if (this.containerRefs[nodePath])
						return;

					this.containerRefs[nodePath] = _ref;
					if (this.rendererRefs[nodePath] && renderChildren && filteredKeys.length > 0)
						this.forceUpdate();
				}}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + "/" : ""), level + 1))}
			</div>);
	}

	private renderItem(item: any, nodePath: string, key: string, expanded: boolean) {
		if (this.props.hideRootElement && nodePath.length === 1)
			return null;

		const Renderer: TreeRenderer = this.props.renderer || DefaultTreeRenderer;

		return (
			<Renderer
				name={key}
				item={item}
				path={nodePath}
				expandToggler={this.toggleExpanded}
				onClick={this.onNodeClicked}
				onDoubleClick={this.onNodeDoubleClicked}
				expanded={expanded}
				focused={nodePath === this.state.focused}/>
		);
	}

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx};
	};

}

