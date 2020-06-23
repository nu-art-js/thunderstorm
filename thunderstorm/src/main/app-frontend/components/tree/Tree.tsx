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
	removeItemFromArray
} from "@nu-art/ts-common";
import {TreeNode,} from "./types";
import {KeyboardListener} from "../../tools/KeyboardListener";
import {stopPropagation} from '../../utils/tools';
import {
	_Renderer,
	Adapter,
	TreeRendererProps,
    _TreeRenderer
} from "./Adapter";


export type BaseTreeProps = {
	id: string
	onNodeFocused?: (path: string, item: any) => void;
	onNodeClicked?: (path: string, item: any) => void;
	callBackState: (key: string, value: any, level: number) => boolean
	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	nodesState?: TreeNodeState;
	indentPx: number;
	checkExpanded: (expanded: TreeNodeState, path: string) => boolean
	keyEventHandler?: (node: HTMLDivElement, e: KeyboardEvent) => boolean;
	onFocus?: () => void
	onBlur?: () => void

	adapter: Adapter
}

export type TreeNodeState = { [path: string]: boolean };
type TreeState = {
	expanded: TreeNodeState,
	focused?: string
	lastFocused?: string
}


export class Tree<P extends BaseTreeProps = BaseTreeProps, S extends TreeState = TreeState>
	extends React.Component<P, TreeState> {

	static defaultProps: Partial<BaseTreeProps> = {
		indentPx: 20,
		checkExpanded: (expanded: TreeNodeState, path: string) => expanded[path],
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};

	constructor(props: P) {
		super(props);

		this.state = {expanded: this.recursivelyExpand(this.props.adapter.data, this.props.callBackState || (() => true))} as S;
	}

	render() {
		return <KeyboardListener
			id={this.props.id}
			onKeyboardEventListener={this.keyEventHandler}
			onFocus={this.onFocus}
			onBlur={this.onBlur}>
			{this.renderNode(this.props.adapter.data, "", "", 1)}
		</KeyboardListener>;
	}

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		let data = _data;
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.props.adapter.adjust(data);
		data = adjustedNode.data;

		let renderChildren = true;
		let filteredKeys: any[] = [];

		const expanded = this.props.checkExpanded(this.state.expanded, nodePath);
		if (!expanded)
			renderChildren = false;

		if (typeof data !== "object")
			renderChildren = false;

		if (renderChildren)
			filteredKeys = this.props.adapter.getFilteredChildren(data);

		const nodeRefResolver = (_ref: HTMLDivElement) => {
			if (this.rendererRefs[nodePath])
				return;

			this.rendererRefs[nodePath] = _ref;
			if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};

		const containerRefResolver = (_ref: HTMLDivElement) => {
			if (this.containerRefs[nodePath])
				return;

			this.containerRefs[nodePath] = _ref;
			if (renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};

		return <div key={nodePath} ref={nodeRefResolver}>
			{this.renderItem(data, nodePath, key, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</div>
	};

	private renderChildren(data: any, nodePath: string, _path: string, level: number, filteredKeys: any[], renderChildren: boolean, adjustedNode: { data: object; deltaPath?: string }, containerRefResolver: (_ref: HTMLDivElement) => void) {
		if (!(filteredKeys.length > 0 && renderChildren))
			return;

		const containerRef: HTMLDivElement = this.containerRefs[nodePath];

		return (
			<div
				style={this.getChildrenContainerStyle(level, this.rendererRefs[nodePath], containerRef, this.containerRefs[_path])}
				ref={containerRefResolver}>
				{containerRef && filteredKeys.map(
					(childKey) => this.renderNode(data[childKey], childKey, nodePath + (adjustedNode.deltaPath ? adjustedNode.deltaPath + "/" : ""), level + 1))}
			</div>);
	}

	private renderItem(item: any, path: string, key: string, expanded: boolean) {
		if (this.props.adapter.hideRoot && path.length === 1)
			return null;

		const TreeNodeRenderer: _TreeRenderer<TreeRendererProps> = this.props.adapter.getTreeNodeRenderer();
		const node: TreeNode = {
			adapter: this.props.adapter,
			propKey: key,
			path,
			item,
			expandToggler: this.toggleExpandState,
			onClick: this.onNodeClicked,
			onFocus: this.onNodeFocused,
			expanded: expanded,
			focused: path === this.state.focused,
		}
		return (<TreeNodeRenderer item={item} node={node}/>);
	}

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx};
	};

	private setFocusedNode(path: string) {
		console.log(`focused: ${path}`);
		this.setState({focused: path});
	}

	protected keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent): void => {
		if (this.props.keyEventHandler && this.props.keyEventHandler(node, e))
			return;

		console.log(`focused on tree: ${this.props.id}`);

		let keyCode = e.code;
		if (keyCode === "Escape") {
			stopPropagation(e);
			return node.blur();
		}

		const keys = Object.keys(this.state.expanded);
		const renderedElements: string[] = keys.reduce((carry, key) => {
			if (this.state.expanded[key])
				return carry;

			keys.forEach(el => {
				if (el.startsWith(key) && el !== key)
					removeItemFromArray(carry, el);
			});
			return carry;
		}, keys);

		const focused = this.state.focused;
		const idx = renderedElements.findIndex(el => el === focused);
		if (idx >= renderedElements.length)
			return;


		if (focused && keyCode === "ArrowRight") {
			stopPropagation(e);
			if (!this.props.checkExpanded(this.state.expanded, focused))
				return this.expandOrCollapse(focused, true);
			else
				keyCode = "ArrowDown";
		}

		if (focused && keyCode === "ArrowLeft") {
			stopPropagation(e);
			if (this.props.checkExpanded(this.state.expanded, focused))
				return this.expandOrCollapse(focused, false);
			else {
				const temp = focused.substr(0, focused.length - 1);
				if (temp.length === 0)
					return;

				const parentFocused = temp.substring(0, temp.lastIndexOf("/") + 1);

				return this.setFocusedNode(parentFocused);
			}
		}

		if (keyCode === "ArrowDown") {
			stopPropagation(e);
			if (idx === -1 || idx + 1 === renderedElements.length)
				return this.setFocusedNode(renderedElements[0]);

			return this.setFocusedNode(renderedElements[idx + 1])
		}

		if (keyCode === "ArrowUp") {
			stopPropagation(e);
			if (idx === -1)
				return this.setFocusedNode(renderedElements[0]);

			if (idx === 0)
				return this.setFocusedNode(renderedElements[renderedElements.length - 1]);

			return this.setFocusedNode(renderedElements[idx - 1])
		}

		if (focused && keyCode === "Enter") {
			stopPropagation(e);
			const item = this.getItemByPath(focused);

			if (item.action && typeof item.action === "function")
				return item.action();

			this.props.onNodeClicked && this.props.onNodeClicked(focused, item);
		}
	};

	getItemByPath(path: string) {
		let item: any = this.props.adapter.data;

		const hierarchy: string[] = path.split('/');
		hierarchy.shift();

		for (const el of hierarchy) {
			if (el) {
				item = item[el];
				if (!item)
					return;
			}
		}
		const deltaPath = this.props.adapter.adjust(item).deltaPath;
		if (deltaPath)
			item = item[deltaPath];

		return item;
	}

	recursivelyExpand = (obj: object, condition: (key: string, value: any, level: number) => boolean) => {
		const state = {'/': condition ? condition('/', obj, 0) : false};
		return this.recursivelyExpandImpl(obj, state, condition)
	};

	private recursivelyExpandImpl = (obj: object, state: TreeNodeState, condition: (key: string, value: any, level: number) => boolean, path: string = "/", level: number = 1) => {
		if (obj === null)
			return state;

		const _obj = this.props.adapter.adjust(obj);
		return _keys(obj).reduce((_state, key) => {
			const value = obj[key];
			if (!_obj.deltaPath)
				_state[`${path}${key}/`] = condition(key, value, level);
			if (condition(key, value, level) && typeof value === "object")
				this.recursivelyExpandImpl(value, _state, condition, `${path}${key}/`, level + 1);

			return _state;
		}, state);
	};

	private toggleExpandState = (e: React.MouseEvent, _expanded?: boolean): void => {
		const path = e.currentTarget.id;
		this.expandOrCollapse(path, _expanded);
	};

	private expandOrCollapse = (path: string, _expanded?: boolean): void => {
		this.setState((prevState: TreeState) => {
			const expanded = prevState.expanded[path];
			prevState.expanded[path] = _expanded !== undefined ? _expanded : !expanded;
			prevState.focused = path;
			return prevState;
		})
	};

	private onNodeFocused = (e: React.MouseEvent): void => {
		// This is an assumption that we should document somewhere
		const path = e.currentTarget.id;
		const item = this.getItemByPath(path);

		this.props.onNodeFocused && this.props.onNodeFocused(path, item);
		if (this.state.focused === path)
			return;

		this.setFocusedNode(path);
	};

	private onNodeClicked = (e: React.MouseEvent): void => {
		this.onNodeFocused(e);
		// This is an assumption that we should document somewhere
		const path = e.currentTarget.id;
		const item = this.getItemByPath(path);

		this.props.onNodeClicked && this.props.onNodeClicked(path, item)
	};

	private onBlur = () => {
		this.setState({
			              focused: '',
			              lastFocused: this.state.focused || ''
		              });
		this.props.onBlur && this.props.onBlur();
	};

	private onFocus = () => {
		this.setState({
			              focused: this.state.lastFocused || '',
			              lastFocused: ''
		              });
		this.props.onFocus && this.props.onFocus();
	};
}

