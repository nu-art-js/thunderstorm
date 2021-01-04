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
import {removeItemFromArray} from "@ir/ts-common";
import {TreeNode,} from "./types";
import {KeyboardListener} from "../../tools/KeyboardListener";
import {stopPropagation} from '../../utils/tools';
import {Adapter} from "../adapter/Adapter";
import {_BaseNodeRenderer} from "../adapter/BaseRenderer";

export type NodeExpandCondition = (key: string, value: any, level: number, path: string) => boolean | undefined;

export type BaseTreeProps = {
	id: string
	onNodeFocused?: (path: string, item: any) => void;
	onNodeClicked?: (path: string, item: any) => void;
	expanded: TreeNodeExpandState
	childrenContainerStyle?: (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentRef?: HTMLDivElement) => CSSProperties
	// nodesState?: TreeNodeState;
	indentPx: number;
	checkExpanded: (expanded: TreeNodeExpandState, path: string) => boolean | undefined
	keyEventHandler?: (node: HTMLDivElement, e: KeyboardEvent) => void;
	onFocus?: () => void
	onBlur?: () => void
	unMountFromOutside?: () => void
	selectedItem?: any
	adapter: Adapter
}

export type TreeNodeExpandState = { [path: string]: true | undefined };
type TreeState = {
	expanded: TreeNodeExpandState
	focused?: string
	lastFocused?: string
	adapter: Adapter
}


export class Tree<P extends BaseTreeProps = BaseTreeProps, S extends TreeState = TreeState>
	extends React.Component<P, TreeState> {

	static defaultProps: Partial<BaseTreeProps> = {
		indentPx: 20,
		checkExpanded: (expanded: TreeNodeExpandState, path: string) => expanded[path]
	};

	protected containerRefs: { [k: string]: HTMLDivElement } = {};
	protected rendererRefs: { [k: string]: HTMLDivElement } = {};
	protected renderedElements: string[] = [];

	constructor(props: P) {
		super(props);
		this.state = {
			adapter: this.props.adapter,
			expanded: props.expanded || {"/": true}
		};
	}

	static getDerivedStateFromProps(props: BaseTreeProps, state: TreeState) {
		if (props.adapter.data === state.adapter.data)
			return null;

		state.adapter = props.adapter;
		// Tree.recalculateExpanded(props, state);

		return state;
	}

	componentDidMount(): void {
		this.renderedElementsInit();
	}

	renderedElementsInit = () => {
		const keys = Object.keys(this.state.expanded);
		this.renderedElements = keys.reduce((carry, key) => {
			if (this.state.expanded[key])
				return carry;

			this.state.adapter.hideRoot && removeItemFromArray(carry, '/');

			keys.forEach(el => {
				if (el.startsWith(key) && el !== key)
					removeItemFromArray(carry, el);
			});
			return carry;
		}, keys);
	};

	render() {
		return <KeyboardListener
			id={this.props.id}
			onKeyboardEventListener={this.keyEventHandler}
			onFocus={this.onFocus}
			onBlur={this.onBlur}>
			{this.renderNode(this.state.adapter.data, "", "", 1)}
		</KeyboardListener>;
	}

	private renderNode = (_data: any, key: string, _path: string, level: number) => {
		const nodePath = `${_path}${key}/`;
		const adjustedNode = this.state.adapter.adjust(_data);
		const data = adjustedNode.data;

		let filteredKeys: any[] = [];

		let expanded = !!this.props.checkExpanded(this.state.expanded, nodePath);
		if (nodePath.endsWith("_children/"))
			expanded = true;

		let renderChildren = expanded;

		if (typeof data !== "object")
			renderChildren = false;

		if (renderChildren)
			filteredKeys = this.state.adapter.getFilteredChildren(data);

		const nodeRefResolver = this.nodeResolver(nodePath, renderChildren, filteredKeys);
		const containerRefResolver = this.resolveContainer(nodePath, renderChildren, filteredKeys);

		return <div key={nodePath} ref={nodeRefResolver}>
			{this.renderItem(data, nodePath, key, expanded)}
			{this.renderChildren(data, nodePath, _path, level, filteredKeys, renderChildren, adjustedNode, containerRefResolver)}
		</div>;
	};

	private nodeResolver(nodePath: string, renderChildren: boolean, filteredKeys: any[]) {
		return (_ref: HTMLDivElement) => {
			if (this.rendererRefs[nodePath])
				return;

			this.rendererRefs[nodePath] = _ref;
			if (this.containerRefs[nodePath] && renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};
	}

	private resolveContainer(nodePath: string, renderChildren: boolean, filteredKeys: any[]) {
		return (_ref: HTMLDivElement) => {
			if (this.containerRefs[nodePath])
				return;

			this.containerRefs[nodePath] = _ref;
			if (renderChildren && filteredKeys.length > 0)
				this.forceUpdate();
		};
	}

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

	private renderItem(item: any, path: string, key: string, expanded?: boolean) {
		if (this.state.adapter.hideRoot && path.length === 1)
			return null;

		const TreeNodeRenderer: _BaseNodeRenderer<any> = this.state.adapter.treeNodeRenderer;
		// console.log("isParent: ", this.state.adapter.isParent(item));
		const node: TreeNode = {
			adapter: this.state.adapter,
			propKey: key,
			path,
			item,
			expandToggler: this.state.adapter.isParent(item) ? this.toggleExpandState : this.ignoreToggler,
			onClick: this.onNodeClicked,
			onFocus: this.onNodeFocused,
			expanded: !!expanded,
			focused: path === this.state.focused,
			selected: item === this.props.selectedItem
		};
		return <div onMouseEnter={() => this.setState({focused: node.path})} onMouseLeave={() => this.setState({focused: ''})}><TreeNodeRenderer item={item}
		                                                                                                                                         node={node}/>
		</div>;
	}

	private getChildrenContainerStyle = (level: number, parentNodeRef: HTMLDivElement, containerRef: HTMLDivElement, parentContainerRef?: HTMLDivElement): CSSProperties => {
		if (!containerRef)
			return {};

		if (this.props.childrenContainerStyle)
			return this.props.childrenContainerStyle(level, parentNodeRef, containerRef, parentContainerRef);

		return {marginLeft: this.props.indentPx};
	};

	private setFocusedNode(path: string) {
		this.rendererRefs[path].scrollIntoView({block: "nearest"});
		this.setState({focused: path});
	}

	protected keyEventHandler = (node: HTMLDivElement, e: KeyboardEvent): void => {

		this.props.keyEventHandler && this.props.keyEventHandler(node, e);

		let keyCode = e.code;
		if (keyCode === "Escape") {
			stopPropagation(e);
			return this.props.unMountFromOutside ? this.props.unMountFromOutside() : node.blur();
		}

		const focused = this.state.focused;
		const idx = this.renderedElements.findIndex(el => el === focused);
		if (idx >= this.renderedElements.length)
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
			if (idx === -1 || idx + 1 === this.renderedElements.length)
				return this.setFocusedNode(this.renderedElements[0]);

			return this.setFocusedNode(this.renderedElements[idx + 1]);
		}

		if (keyCode === "ArrowUp") {
			stopPropagation(e);
			if (idx === -1)
				return this.setFocusedNode(this.renderedElements[0]);

			if (idx === 0)
				return this.setFocusedNode(this.renderedElements[this.renderedElements.length - 1]);

			return this.setFocusedNode(this.renderedElements[idx - 1]);
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
		let item: any = this.state.adapter.data;

		const hierarchy: string[] = path.split('/');
		hierarchy.shift();

		for (const el of hierarchy) {
			if (el) {
				item = item[el];
				if (!item)
					return;
			}
		}
		const deltaPath = this.state.adapter.adjust(item).deltaPath;
		if (deltaPath)
			item = item[deltaPath];

		return item;
	}

	private ignoreToggler = (): void => {
	};

	private toggleExpandState = (e: React.MouseEvent, _expanded?: boolean): void => {
		const path = e.currentTarget.id;

		this.expandOrCollapse(path, _expanded);
	};

	private expandOrCollapse = (path: string, forceExpandState?: boolean): void => {
		if (path === "/" && this.state.adapter.hideRoot && forceExpandState === false)
			return;

		const treeExpandedState = this.state.expanded;
		const currentExpandState = treeExpandedState[path];
		let newExpandState = currentExpandState === undefined;
		if (forceExpandState !== undefined)
			newExpandState = forceExpandState ? forceExpandState : false;

		if (newExpandState)
			treeExpandedState[path] = newExpandState;
		else
			delete treeExpandedState[path];

		this.setState({focused: path});
		this.forceUpdate();
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

		this.props.onNodeClicked && this.props.onNodeClicked(path, item);
	};

	private onBlur = () => {
		if (this.props.onBlur && this.props.onBlur())
			return;

		this.setState(state => {
			if (!state.focused)
				return state;

			return {
				...state,
				lastFocused: state.focused,
				focused: ''
			};
		});
	};

	private onFocus = () => {
		if (this.props.onFocus && this.props.onFocus())
			return;

		this.setState(state => {
			const focused = state.lastFocused || (this.state.adapter.hideRoot ? Object.keys(state.expanded)[1] : Object.keys(state.expanded)[0]);
			if (state.focused === focused)
				return state;

			return {
				...state,
				lastFocused: '',
				focused
			};
		});
	};

	public static recursivelyExpand(adapter: Adapter, expandCondition: NodeExpandCondition = () => true, state: TreeNodeExpandState = {
		'/': expandCondition('/', adapter.data, 0, '/') || undefined
	}) {
		return recursivelyExpandImpl(adapter.data, state, expandCondition, adapter);
	}
}

const recursivelyExpandImpl = <K extends object>(obj: K, state: TreeNodeExpandState, condition: NodeExpandCondition, adapter: Adapter, path: string = "/", level: number = 1): TreeNodeExpandState => {
	if (obj === null)
		return state;

	const _obj = adapter.adjust(obj);
	const children: (keyof K)[] = adapter.getFilteredChildren(obj);
	return children.reduce((_state: TreeNodeExpandState, _key: keyof K) => {
		const key = _key as string;
		const value = obj[_key];
		const newPath = `${path}${key}/`;

		if (!_obj.deltaPath) {
			const b = condition(key, value, level, newPath);
			if (b)
				_state[newPath] = b;
		}

		// if (condition(key, value, level, newPath) && typeof value === "object")
		if (typeof value === "object")
			recursivelyExpandImpl(value as unknown as object, _state, condition, adapter, newPath, level + 1);

		return _state;
	}, state);
};

